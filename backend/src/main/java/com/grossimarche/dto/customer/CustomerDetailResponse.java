package com.grossimarche.dto.customer;

import com.grossimarche.dto.order.OrderSummaryResponse;
import com.grossimarche.entity.enums.UserStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Admin customer detail: profile, lifetime figures and recent orders. */
public record CustomerDetailResponse(
        UUID id,
        String fullName,
        String phone,
        String email,
        UserStatus status,
        long orderCount,
        BigDecimal totalSpent,
        Instant createdAt,
        List<OrderSummaryResponse> recentOrders
) {
}
