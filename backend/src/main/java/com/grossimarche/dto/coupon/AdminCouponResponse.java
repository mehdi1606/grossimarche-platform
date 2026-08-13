package com.grossimarche.dto.coupon;

import com.grossimarche.entity.enums.CouponType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Admin view of a coupon, including its live redemption count. */
public record AdminCouponResponse(
        UUID id,
        String code,
        CouponType type,
        BigDecimal value,
        BigDecimal minOrderSubtotal,
        BigDecimal maxDiscount,
        Instant startsAt,
        Instant expiresAt,
        Integer usageLimit,
        int perUserLimit,
        boolean active,
        long usageCount,
        Instant createdAt
) {
}
