package com.grossimarche.dto.order;

import com.grossimarche.entity.enums.OrderStatus;
import com.grossimarche.entity.enums.PaymentMethod;
import com.grossimarche.entity.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Full order detail: lines, totals, delivery address snapshot and the status timeline. */
public record OrderDetailResponse(
        UUID id,
        String orderNumber,
        OrderStatus status,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        BigDecimal subtotal,
        BigDecimal discountTotal,
        String couponCode,
        BigDecimal couponDiscount,
        BigDecimal deliveryFee,
        BigDecimal total,
        String note,
        DeliveryAddress deliveryAddress,
        List<OrderItemResponse> items,
        List<OrderStatusHistoryResponse> timeline,
        Instant createdAt
) {

    /** The address as captured at checkout time (from the order's JSONB snapshot). */
    public record DeliveryAddress(
            String label,
            String city,
            String addressLine,
            Double lat,
            Double lng
    ) {
    }
}
