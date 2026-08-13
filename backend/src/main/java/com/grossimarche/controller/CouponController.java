package com.grossimarche.controller;

import com.grossimarche.dto.coupon.CouponPreviewResponse;
import com.grossimarche.dto.coupon.CouponValidateRequest;
import com.grossimarche.security.SecurityUtils;
import com.grossimarche.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Authenticated coupon check against the caller's current cart (no order is created). */
@RestController
@RequestMapping("/api/v1/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping("/validate")
    public CouponPreviewResponse validate(@Valid @RequestBody CouponValidateRequest body) {
        return couponService.preview(SecurityUtils.currentUserId(), body.code());
    }
}
