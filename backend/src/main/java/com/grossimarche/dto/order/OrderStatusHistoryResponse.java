package com.grossimarche.dto.order;

import com.grossimarche.entity.enums.OrderStatus;

import java.time.Instant;
import java.util.UUID;

/** One entry in an order's status timeline. */
public record OrderStatusHistoryResponse(
        OrderStatus status,
        UUID changedBy,
        String note,
        Instant createdAt
) {
}
