package com.grossimarche.entity;

import com.grossimarche.entity.enums.CouponType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A discount code applied at checkout. The discount is always computed server-side in
 * {@code PricingService}; this entity only holds the rules. {@code perUserLimit} and the
 * optional {@code usageLimit} are enforced against {@link CouponRedemption} rows.
 */
@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon extends AuditableEntity {

    @Column(name = "code", nullable = false, unique = true, length = 40)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private CouponType type;

    /** Percentage (0–100) when {@code type == PERCENTAGE}, else a fixed MAD amount. */
    @Column(name = "value", nullable = false, precision = 12, scale = 2)
    private BigDecimal value;

    @Column(name = "min_order_subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal minOrderSubtotal;

    /** Cap for percentage coupons (max MAD off). Null = no cap. Ignored for FIXED. */
    @Column(name = "max_discount", precision = 12, scale = 2)
    private BigDecimal maxDiscount;

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    /** Total redemptions allowed across all users. Null = unlimited. */
    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "per_user_limit", nullable = false)
    private int perUserLimit;

    @Column(name = "active", nullable = false)
    private boolean active;
}
