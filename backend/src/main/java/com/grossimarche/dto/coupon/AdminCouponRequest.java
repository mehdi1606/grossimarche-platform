package com.grossimarche.dto.coupon;

import com.grossimarche.entity.enums.CouponType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

/** Admin: create or update a coupon. */
public record AdminCouponRequest(
        @NotBlank @Size(max = 40) String code,
        @NotNull CouponType type,
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal value,
        @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal minOrderSubtotal,
        @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal maxDiscount,
        Instant startsAt,
        Instant expiresAt,
        @Min(1) Integer usageLimit,
        @Min(1) int perUserLimit,
        boolean active
) {
}
