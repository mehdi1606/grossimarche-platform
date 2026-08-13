package com.grossimarche.controller.admin;

import com.grossimarche.dto.common.PageResponse;
import com.grossimarche.dto.coupon.AdminCouponRequest;
import com.grossimarche.dto.coupon.AdminCouponResponse;
import com.grossimarche.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Admin coupon CRUD. Authorization enforced by URL rules and @PreAuthorize on the service. */
@RestController
@RequestMapping("/api/v1/admin/coupons")
public class AdminCouponController {

    private final CouponService couponService;

    public AdminCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    public PageResponse<AdminCouponResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(couponService.list(pageable));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminCouponResponse create(@Valid @RequestBody AdminCouponRequest body) {
        return couponService.create(body);
    }

    @PutMapping("/{id}")
    public AdminCouponResponse update(@PathVariable UUID id, @Valid @RequestBody AdminCouponRequest body) {
        return couponService.update(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        couponService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
