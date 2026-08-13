package com.grossimarche.dto.mapper;

import com.grossimarche.dto.order.OrderDetailResponse;
import com.grossimarche.dto.order.OrderItemResponse;
import com.grossimarche.dto.order.OrderStatusHistoryResponse;
import com.grossimarche.dto.order.OrderSummaryResponse;
import com.grossimarche.entity.Order;
import com.grossimarche.entity.OrderItem;
import com.grossimarche.entity.OrderStatusHistory;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

/**
 * Order entity → DTO translation, including decoding the JSONB address snapshot. Pure
 * translation; no business logic.
 */
@Component
public class OrderMapper {

    private final ObjectMapper objectMapper;

    public OrderMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public OrderSummaryResponse toSummary(Order order) {
        return new OrderSummaryResponse(order.getId(), order.getOrderNumber(), order.getStatus(),
                order.getPaymentMethod(), order.getPaymentStatus(), order.getTotal(), order.getCreatedAt());
    }

    public OrderItemResponse toItem(OrderItem item) {
        return new OrderItemResponse(item.getProduct().getId(), item.getProductNameSnapshot(),
                item.getUnitSnapshot(), item.getQuantity(), item.getUnitPrice(), item.getLineTotal());
    }

    public OrderStatusHistoryResponse toHistory(OrderStatusHistory history) {
        return new OrderStatusHistoryResponse(history.getStatus(), history.getChangedBy(),
                history.getNote(), history.getCreatedAt());
    }

    public OrderDetailResponse toDetail(Order order, List<OrderItem> items,
                                        List<OrderStatusHistory> timeline) {
        return new OrderDetailResponse(
                order.getId(), order.getOrderNumber(), order.getStatus(), order.getPaymentMethod(),
                order.getPaymentStatus(), order.getSubtotal(), order.getDiscountTotal(),
                order.getCouponCode(), order.getCouponDiscount(),
                order.getDeliveryFee(), order.getTotal(), order.getNote(),
                parseAddress(order.getAddressSnapshot()),
                items.stream().map(this::toItem).toList(),
                timeline.stream().map(this::toHistory).toList(),
                order.getCreatedAt());
    }

    private OrderDetailResponse.DeliveryAddress parseAddress(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        return objectMapper.readValue(json, OrderDetailResponse.DeliveryAddress.class);
    }
}
