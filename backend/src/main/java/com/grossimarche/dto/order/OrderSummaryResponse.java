package com.grossimarche.dto.order;

import com.grossimarche.entity.enums.OrderStatus;
import com.grossimarche.entity.enums.PaymentMethod;
import com.grossimarche.entity.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Compact order view for history lists. */
public record OrderSummaryResponse(
        UUID id,
        String orderNumber,
        OrderStatus status,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        BigDecimal total,
        Instant createdAt
) {
}
