package com.grossimarche.dto.coupon;

import com.grossimarche.entity.enums.CouponType;

import java.math.BigDecimal;

/**
 * Result of validating a coupon against the current cart. When {@code valid} is false the
 * {@code message} explains why and {@code discountAmount} is zero; the HTTP status stays
 * 200 so the storefront can show the reason inline without treating it as an error.
 */
public record CouponPreviewResponse(
        String code,
        CouponType type,
        BigDecimal discountAmount,
        BigDecimal cartSubtotal,
        BigDecimal subtotalAfterDiscount,
        boolean valid,
        String message
) {
}
