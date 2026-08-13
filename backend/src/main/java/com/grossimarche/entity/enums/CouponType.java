package com.grossimarche.entity.enums;

/** How a coupon's discount is computed. */
public enum CouponType {
    /** {@code value} is a percentage of the goods subtotal (0–100), optionally capped. */
    PERCENTAGE,
    /** {@code value} is a fixed amount in MAD off the goods subtotal. */
    FIXED
}
