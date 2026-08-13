package com.grossimarche.dto.coupon;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Ask whether a code applies to the caller's current cart (no commit). */
public record CouponValidateRequest(
        @NotBlank @Size(max = 40) String code
) {
}
