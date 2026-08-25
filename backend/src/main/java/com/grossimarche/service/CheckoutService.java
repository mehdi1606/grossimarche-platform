package com.grossimarche.service;

import com.grossimarche.dto.order.CmiRedirectResponse;
import com.grossimarche.dto.order.CreateOrderRequest;
import com.grossimarche.dto.order.OrderCreatedResponse;
import com.grossimarche.dto.order.OrderDetailResponse;
import com.grossimarche.dto.mapper.OrderMapper;
import com.grossimarche.entity.Address;
import com.grossimarche.entity.Cart;
import com.grossimarche.entity.CartItem;
import com.grossimarche.entity.Coupon;
import com.grossimarche.entity.Order;
import com.grossimarche.entity.OrderItem;
import com.grossimarche.entity.OrderStatusHistory;
import com.grossimarche.entity.Product;
import com.grossimarche.entity.enums.OrderStatus;
import com.grossimarche.entity.enums.PaymentMethod;
import com.grossimarche.entity.enums.PaymentStatus;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.InsufficientStockException;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.integration.payment.PaymentGateway;
import com.grossimarche.repository.AddressRepository;
import com.grossimarche.repository.CartItemRepository;
import com.grossimarche.repository.CartRepository;
import com.grossimarche.repository.OrderItemRepository;
import com.grossimarche.repository.OrderRepository;
import com.grossimarche.repository.OrderStatusHistoryRepository;
import com.grossimarche.repository.ProductPriceTierRepository;
import com.grossimarche.repository.ProductRepository;
import com.grossimarche.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Checkout: turns a cart into an order in one transaction. Idempotent (Idempotency-Key),
 * recomputes every total server-side, decrements stock atomically (never negative, never
 * partial), snapshots prices/names/address, then awards loyalty (COD) or returns a CMI
 * redirect (CARD). Client-supplied totals are never read.
 */
@Service
public class CheckoutService {

    private static final DateTimeFormatter YYMMDD = DateTimeFormatter.ofPattern("yyMMdd");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final BundleService bundleService;
    private final ProductRepository productRepository;
    private final ProductPriceTierRepository priceTierRepository;
    private final AddressRepository addressRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final UserRepository userRepository;
    private final PricingService pricingService;
    private final LoyaltyService loyaltyService;
    private final CouponService couponService;
    private final PaymentGateway paymentGateway;
    private final OrderMapper orderMapper;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher events;

    public CheckoutService(CartRepository cartRepository, CartItemRepository cartItemRepository,
                           ProductRepository productRepository, ProductPriceTierRepository priceTierRepository,
                           AddressRepository addressRepository, OrderRepository orderRepository,
                           OrderItemRepository orderItemRepository,
                           OrderStatusHistoryRepository statusHistoryRepository,
                           UserRepository userRepository, PricingService pricingService,
                           LoyaltyService loyaltyService, CouponService couponService,
                           PaymentGateway paymentGateway, OrderMapper orderMapper, ObjectMapper objectMapper,
                           BundleService bundleService, ApplicationEventPublisher events) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.bundleService = bundleService;
        this.productRepository = productRepository;
        this.priceTierRepository = priceTierRepository;
        this.addressRepository = addressRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.userRepository = userRepository;
        this.pricingService = pricingService;
        this.loyaltyService = loyaltyService;
        this.couponService = couponService;
        this.paymentGateway = paymentGateway;
        this.orderMapper = orderMapper;
        this.objectMapper = objectMapper;
        this.events = events;
    }

    @Transactional
    public OrderCreatedResponse checkout(UUID userId, CreateOrderRequest req, String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "En-tête Idempotency-Key requis.");
        }
        // 1. Idempotency: the same key returns the same order, never a duplicate.
        Order existing = orderRepository.findByIdempotencyKey(idempotencyKey).orElse(null);
        if (existing != null) {
            return buildResponse(existing, null, null);
        }

        // 2. Load the cart and reject if empty.
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_EMPTY, "Votre panier est vide."));
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        if (items.isEmpty()) {
            throw new BusinessException(ErrorCode.CART_EMPTY, "Votre panier est vide.");
        }

        // 3. Load the delivery address (must belong to the user).
        Address address = addressRepository.findByIdAndUserId(req.addressId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Adresse", req.addressId()));

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(userRepository.getReferenceById(userId))
                .addressSnapshot(serializeAddress(address))
                .paymentMethod(req.paymentMethod())
                .note(req.note())
                .idempotencyKey(idempotencyKey)
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.AWAITING_PAYMENT)
                .subtotal(BigDecimal.ZERO).discountTotal(BigDecimal.ZERO)
                .couponDiscount(BigDecimal.ZERO)
                .deliveryFee(BigDecimal.ZERO).total(BigDecimal.ZERO)
                .build();
        order = orderRepository.save(order);

        // 4. Re-validate each line against live price and stock; decrement atomically.
        List<OrderItem> orderItems = new ArrayList<>();
        List<PricingService.LinePricing> pricingLines = new ArrayList<>();
        // The same lines, at the prices we just resolved, so bundle offers are measured against
        // what the customer is actually being charged rather than against list prices.
        List<BundleService.CartLine> bundleLines = new ArrayList<>();
        for (CartItem item : items) {
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produit", item.getProduct().getId()));
            if (!product.isActive()) {
                throw new BusinessException(ErrorCode.PRICE_CHANGED,
                        "Le produit « " + product.getName() + " » n'est plus disponible.");
            }
            int qty = item.getQuantity();
            BigDecimal base = product.getPrice();
            BigDecimal effective = pricingService.resolveUnitPrice(base,
                    priceTierRepository.findByProductIdOrderByMinQuantityAsc(product.getId()), qty);

            if (productRepository.decrementStock(product.getId(), qty) == 0) {
                throw new InsufficientStockException(
                        "Stock insuffisant pour « " + product.getName() + " ».");
            }

            orderItems.add(OrderItem.builder()
                    .order(order)
                    .product(productRepository.getReferenceById(product.getId()))
                    .productNameSnapshot(product.getName())
                    .unitSnapshot(product.getUnit())
                    .quantity(qty)
                    .unitPrice(effective)
                    .lineTotal(pricingService.lineTotal(effective, qty))
                    .build());
            pricingLines.add(new PricingService.LinePricing(base, effective, qty));
            bundleLines.add(new BundleService.CartLine(product.getId(), qty, effective));
        }

        // 5. Recompute totals server-side.
        // Delivery is priced from the destination city of the address chosen above.
        PricingService.Totals totals = pricingService.computeTotals(pricingLines, address.getCity());

        // 5b. Apply an optional coupon: validated server-side against the fresh subtotal,
        //     snapshotted on the order. An invalid/expired code aborts checkout (no order).
        Coupon appliedCoupon = null;
        BigDecimal couponDiscount = BigDecimal.ZERO;
        if (req.couponCode() != null && !req.couponCode().isBlank()) {
            CouponService.Evaluation ev = couponService.evaluate(userId, req.couponCode(), totals.subtotal());
            if (!ev.valid()) {
                throw new BusinessException(ev.errorCode(), ev.message());
            }
            appliedCoupon = ev.coupon();
            couponDiscount = ev.discount();
        }

        // 5c. Bundle offers ("paniers"): whenever the cart happens to contain every component
        //     of an active offer, the difference between those components and the offer price
        //     is taken off automatically. Nothing has to be "added as a bundle" - assembling
        //     the set by hand earns the same price as clicking the offer.
        BundleService.BundleDiscount bundles = bundleService.computeDiscount(bundleLines);
        BigDecimal goodsDiscount = totals.discountTotal().add(bundles.total());

        order.setSubtotal(totals.subtotal());
        order.setDiscountTotal(goodsDiscount);
        order.setCouponCode(appliedCoupon == null ? null : appliedCoupon.getCode());
        order.setCouponDiscount(couponDiscount);
        order.setDeliveryFee(totals.deliveryFee());
        // Coupon and bundle offers reduce goods only; delivery is charged on the original
        // subtotal. The total can never go below the delivery fee alone.
        BigDecimal goods = totals.subtotal().subtract(couponDiscount).subtract(bundles.total());
        if (goods.signum() < 0) {
            goods = BigDecimal.ZERO;
        }
        order.setTotal(pricingService.money(goods.add(totals.deliveryFee())));

        // 6. Payment method drives the initial state.
        boolean cod = req.paymentMethod() == PaymentMethod.COD;
        order.setStatus(cod ? OrderStatus.CONFIRMED : OrderStatus.PENDING);
        order.setPaymentStatus(cod ? PaymentStatus.PENDING_ON_DELIVERY : PaymentStatus.AWAITING_PAYMENT);

        orderItemRepository.saveAll(orderItems);
        statusHistoryRepository.save(OrderStatusHistory.builder()
                .order(order).status(order.getStatus()).changedBy(userId)
                .note("Commande créée").build());

        // 7. Empty the cart and record the coupon redemption (same transaction → limits hold).
        cartItemRepository.deleteByCartId(cart.getId());
        if (appliedCoupon != null) {
            couponService.recordRedemption(appliedCoupon, userId, order, couponDiscount);
        }

        // 8/9. Loyalty (COD now; CARD on payment confirmation) and payment redirect.
        //      Points are earned on the amount actually paid for goods (net of any coupon).
        BigDecimal loyaltyBase = order.getSubtotal().subtract(couponDiscount);
        Integer pointsEarned = null;
        CmiRedirectResponse payment = null;
        if (cod) {
            pointsEarned = loyaltyService.award(userId, order.getId(), loyaltyBase);
        } else {
            payment = paymentGateway.createRedirect(order);
        }

        // 10. Publish events (the WebSocket layer consumes them AFTER_COMMIT). The status
        //     event drives live order tracking; OrderPlacedEvent drives the NEW_ORDER
        //     back-office notification (fired once, only on creation).
        events.publishEvent(new OrderStatusChangedEvent(order.getId(), order.getOrderNumber(),
                order.getStatus(), userId, "Commande " + order.getStatus()));
        events.publishEvent(new OrderPlacedEvent(order.getId(), order.getOrderNumber(),
                customerLabel(userId), address.getCity(), orderItems.size(),
                orderItems.stream().mapToInt(OrderItem::getQuantity).sum(),
                order.getTotal(), order.getPaymentMethod()));

        return buildResponse(order, payment, pointsEarned);
    }

    private OrderCreatedResponse buildResponse(Order order, CmiRedirectResponse payment, Integer points) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        List<OrderStatusHistory> history = statusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(order.getId());
        OrderDetailResponse detail = orderMapper.toDetail(order, items, history);
        return new OrderCreatedResponse(detail, payment, points);
    }

    /**
     * How the buyer is named in the back-office notification. Accounts are passwordless, so a
     * shopper who never filled a profile has only a phone or an e-mail - fall back to those
     * rather than showing an empty name.
     */
    private String customerLabel(UUID userId) {
        return userRepository.findById(userId)
                .map(user -> {
                    if (user.getFullName() != null && !user.getFullName().isBlank()) {
                        return user.getFullName();
                    }
                    return user.getPhone() != null ? user.getPhone() : user.getEmail();
                })
                .orElse("Client");
    }

    private String serializeAddress(Address address) {
        return objectMapper.writeValueAsString(new OrderDetailResponse.DeliveryAddress(
                address.getLabel(), address.getCity(), address.getAddressLine(),
                address.getLat(), address.getLng()));
    }

    private String generateOrderNumber() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String candidate = "GM-" + LocalDate.now(ZoneOffset.UTC).format(YYMMDD) + "-"
                    + randomSuffix();
            if (orderRepository.findByOrderNumber(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Impossible de générer un numéro de commande.");
    }

    private String randomSuffix() {
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(alphabet.charAt(RANDOM.nextInt(alphabet.length())));
        }
        return sb.toString();
    }
}
