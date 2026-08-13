package com.grossimarche.dto.mapper;

import com.grossimarche.dto.coupon.AdminCouponResponse;
import com.grossimarche.entity.Coupon;
import org.springframework.stereotype.Component;

/** Coupon entity → admin DTO. Hand-written, matching {@code ProductMapper} style. */
@Component
public class CouponMapper {

    public AdminCouponResponse toAdmin(Coupon c, long usageCount) {
        return new AdminCouponResponse(c.getId(), c.getCode(), c.getType(), c.getValue(),
                c.getMinOrderSubtotal(), c.getMaxDiscount(), c.getStartsAt(), c.getExpiresAt(),
                c.getUsageLimit(), c.getPerUserLimit(), c.isActive(), usageCount, c.getCreatedAt());
    }
}
