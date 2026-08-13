package com.grossimarche.repository;

import com.grossimarche.entity.CouponRedemption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface CouponRedemptionRepository extends JpaRepository<CouponRedemption, UUID> {

    long countByCouponId(UUID couponId);

    long countByCouponIdAndUserId(UUID couponId, UUID userId);

    /** Frees a coupon when its order is cancelled (per-user / global counts drop back). */
    @Modifying
    @Query("delete from CouponRedemption r where r.order.id = :orderId")
    void deleteByOrderId(UUID orderId);
}
