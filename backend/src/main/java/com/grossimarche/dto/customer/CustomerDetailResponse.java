package com.grossimarche.dto.customer;

import com.grossimarche.dto.order.OrderSummaryResponse;
import com.grossimarche.entity.enums.UserStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Admin customer detail: profile, trade segment, lifetime figures and recent orders.
 *
 * The segment carries more weight here than a label. It decides which price grid this customer
 * is charged and which half of the catalogue they can see at all, so a page about them that
 * omits it cannot explain the prices on their own orders.
 */
public record CustomerDetailResponse(
        UUID id,
        String fullName,
        String phone,
        String email,
        String clientTypeName,
        UserStatus status,
        long orderCount,
        BigDecimal totalSpent,
        Instant createdAt,
        List<OrderSummaryResponse> recentOrders
) {
}
