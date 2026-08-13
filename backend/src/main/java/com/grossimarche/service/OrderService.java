package com.grossimarche.service;

import com.grossimarche.dto.order.OrderDetailResponse;
import com.grossimarche.dto.order.OrderSummaryResponse;
import com.grossimarche.dto.mapper.OrderMapper;
import com.grossimarche.entity.Order;
import com.grossimarche.entity.OrderItem;
import com.grossimarche.entity.OrderStatusHistory;
import com.grossimarche.entity.enums.OrderStatus;
import com.grossimarche.entity.enums.PaymentMethod;
import com.grossimarche.entity.enums.PaymentStatus;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.integration.pdf.InvoiceGenerator;
import com.grossimarche.integration.payment.PaymentGateway;
import com.grossimarche.repository.CouponRedemptionRepository;
import com.grossimarche.repository.OrderItemRepository;
import com.grossimarche.repository.OrderRepository;
import com.grossimarche.repository.OrderStatusHistoryRepository;
import com.grossimarche.repository.ProductRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Order reads, invoices, admin status management (validated by a state machine) and the
 * CMI payment callback. A user can only ever see their own orders (others return 404, so
 * existence is not leaked).
 */
@Service
public class OrderService {

    private static final Map<OrderStatus, Set<OrderStatus>> TRANSITIONS = Map.of(
            OrderStatus.PENDING, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.CONFIRMED, Set.of(OrderStatus.PREPARING, OrderStatus.CANCELLED),
            OrderStatus.PREPARING, Set.of(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED),
            OrderStatus.OUT_FOR_DELIVERY, Set.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED),
            OrderStatus.DELIVERED, Set.of(),
            OrderStatus.CANCELLED, Set.of());

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final ProductRepository productRepository;
    private final CouponRedemptionRepository couponRedemptionRepository;
    private final OrderMapper orderMapper;
    private final InvoiceGenerator invoiceGenerator;
    private final PaymentGateway paymentGateway;
    private final LoyaltyService loyaltyService;
    private final AuditService auditService;
    private final ApplicationEventPublisher events;

    public OrderService(OrderRepository orderRepository, OrderItemRepository orderItemRepository,
                        OrderStatusHistoryRepository statusHistoryRepository,
                        ProductRepository productRepository,
                        CouponRedemptionRepository couponRedemptionRepository, OrderMapper orderMapper,
                        InvoiceGenerator invoiceGenerator, PaymentGateway paymentGateway,
                        LoyaltyService loyaltyService, AuditService auditService,
                        ApplicationEventPublisher events) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.productRepository = productRepository;
        this.couponRedemptionRepository = couponRedemptionRepository;
        this.orderMapper = orderMapper;
        this.invoiceGenerator = invoiceGenerator;
        this.paymentGateway = paymentGateway;
        this.loyaltyService = loyaltyService;
        this.auditService = auditService;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> getOrders(UUID userId, Pageable pageable) {
        return orderRepository.findByUserId(userId, pageable).map(orderMapper::toSummary);
    }

    /** Whether an order belongs to a user — used by the WebSocket subscription check. */
    @Transactional(readOnly = true)
    public boolean userOwnsOrder(UUID orderId, UUID userId) {
        return orderRepository.findByIdAndUserId(orderId, userId).isPresent();
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse getOrder(UUID userId, UUID orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande", orderId));
        return detail(order);
    }

    @Transactional(readOnly = true)
    public byte[] generateInvoice(UUID userId, UUID orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande", orderId));
        return invoiceGenerator.generate(order, orderItemRepository.findByOrderId(orderId));
    }

    // ---- Admin -----------------------------------------------------------------------

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> listAll(Pageable pageable) {
        return orderRepository.findAll(pageable).map(orderMapper::toSummary);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public OrderDetailResponse adminGetOrder(UUID orderId) {
        return detail(getOrderEntity(orderId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public OrderDetailResponse advanceStatus(UUID orderId, OrderStatus target, String note, UUID actorId) {
        Order order = getOrderEntity(orderId);
        if (target == OrderStatus.CANCELLED) {
            return cancel(orderId, actorId, note);
        }
        if (!TRANSITIONS.getOrDefault(order.getStatus(), Set.of()).contains(target)) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Transition invalide : " + order.getStatus() + " → " + target + ".");
        }
        order.setStatus(target);
        recordHistory(order, target, actorId, note);
        publish(order, actorId);
        return detail(order);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public OrderDetailResponse cancel(UUID orderId, UUID actorId, String note) {
        Order order = getOrderEntity(orderId);
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Commande non annulable (statut : " + order.getStatus() + ").");
        }
        // Restore stock and reverse loyalty.
        for (OrderItem item : orderItemRepository.findByOrderId(orderId)) {
            productRepository.incrementStock(item.getProduct().getId(), item.getQuantity());
        }
        loyaltyService.reverse(order.getUser().getId(), orderId);
        // Free any coupon this order consumed, so the code can be used again.
        couponRedemptionRepository.deleteByOrderId(orderId);
        order.setStatus(OrderStatus.CANCELLED);
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            order.setPaymentStatus(PaymentStatus.REFUNDED);
        }
        recordHistory(order, OrderStatus.CANCELLED, actorId, note == null ? "Annulation" : note);
        auditService.record(actorId, "ORDER_CANCELLED", "Order", orderId.toString(), null, null, null);
        publish(order, actorId);
        return detail(order);
    }

    // ---- Payment callback -------------------------------------------------------------

    @Transactional
    public void handlePaymentCallback(Map<String, String> params) {
        PaymentGateway.CallbackResult result = paymentGateway.handleCallback(params);
        // Audit every callback with all card-bearing fields redacted.
        auditService.record(null, "PAYMENT_CALLBACK", "Order", result.orderNumber(), null, null,
                "{\"verified\":" + result.verified() + ",\"success\":" + result.success() + "}");
        if (!result.verified()) {
            throw new BusinessException(ErrorCode.PAYMENT_FAILED, "Signature de paiement invalide.");
        }
        Order order = orderRepository.findByOrderNumber(result.orderNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Commande", result.orderNumber()));
        if (order.getPaymentMethod() != PaymentMethod.CARD
                || order.getPaymentStatus() == PaymentStatus.PAID) {
            return; // idempotent: nothing to do
        }
        if (result.success()) {
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.CONFIRMED);
            recordHistory(order, OrderStatus.CONFIRMED, null, "Paiement confirmé");
            loyaltyService.award(order.getUser().getId(), order.getId(),
                    order.getSubtotal().subtract(order.getCouponDiscount()));
        } else {
            order.setPaymentStatus(PaymentStatus.FAILED);
            recordHistory(order, order.getStatus(), null, "Paiement échoué");
        }
        publish(order, order.getUser().getId());
    }

    // ---- Helpers ----------------------------------------------------------------------

    private Order getOrderEntity(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande", orderId));
    }

    private OrderDetailResponse detail(Order order) {
        return orderMapper.toDetail(order, orderItemRepository.findByOrderId(order.getId()),
                statusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(order.getId()));
    }

    private void recordHistory(Order order, OrderStatus status, UUID actorId, String note) {
        statusHistoryRepository.save(OrderStatusHistory.builder()
                .order(order).status(status).changedBy(actorId).note(note).build());
    }

    private void publish(Order order, UUID actorId) {
        events.publishEvent(new OrderStatusChangedEvent(order.getId(), order.getOrderNumber(),
                order.getStatus(), order.getUser().getId(), "Statut : " + order.getStatus()));
    }
}
