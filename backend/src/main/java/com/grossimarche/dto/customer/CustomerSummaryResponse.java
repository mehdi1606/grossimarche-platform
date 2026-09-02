package com.grossimarche.dto.customer;

import com.grossimarche.entity.enums.UserStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Admin customer list row, with its trade segment, lifetime order count and spend. */
public record CustomerSummaryResponse(
        UUID id,
        String fullName,
        String phone,
        String email,
        String clientTypeName,
        UserStatus status,
        long orderCount,
        BigDecimal totalSpent,
        Instant createdAt
) {
}
