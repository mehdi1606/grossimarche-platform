package com.grossimarche.service;

import com.grossimarche.config.PricingProperties;
import com.grossimarche.entity.enums.CouponType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/** Unit tests for coupon discount maths in the single pricing source of truth. */
class CouponDiscountTest {

    private final PricingService pricing = new PricingService(
            new PricingProperties(new BigDecimal("30.00"), new BigDecimal("500.00")));

    @Test
    void percentage_takesPercentOfSubtotal() {
        // 10% of 300 = 30, no cap.
        assertThat(pricing.couponDiscount(CouponType.PERCENTAGE, new BigDecimal("10"), null,
                new BigDecimal("300.00"))).isEqualByComparingTo("30.00");
    }

    @Test
    void percentage_respectsMaxDiscountCap() {
        // 20% of 1000 = 200, capped at 100.
        assertThat(pricing.couponDiscount(CouponType.PERCENTAGE, new BigDecimal("20"),
                new BigDecimal("100.00"), new BigDecimal("1000.00"))).isEqualByComparingTo("100.00");
    }

    @Test
    void fixed_takesFlatAmount() {
        assertThat(pricing.couponDiscount(CouponType.FIXED, new BigDecimal("50.00"), null,
                new BigDecimal("300.00"))).isEqualByComparingTo("50.00");
    }

    @Test
    void discount_neverExceedsSubtotal() {
        // A 50 MAD coupon on a 30 MAD basket is clamped to 30 (goods never go negative).
        assertThat(pricing.couponDiscount(CouponType.FIXED, new BigDecimal("50.00"), null,
                new BigDecimal("30.00"))).isEqualByComparingTo("30.00");
    }

    @Test
    void percentage_roundsHalfUpToTwoDecimals() {
        // 10% of 33.33 = 3.333 → 3.33.
        assertThat(pricing.couponDiscount(CouponType.PERCENTAGE, new BigDecimal("10"), null,
                new BigDecimal("33.33"))).isEqualByComparingTo("3.33");
    }
}
