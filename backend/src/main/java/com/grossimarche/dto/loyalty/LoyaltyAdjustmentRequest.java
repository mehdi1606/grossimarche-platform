package com.grossimarche.dto.loyalty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Admin: manually adjust a user's points by a signed amount, with a mandatory reason. */
public record LoyaltyAdjustmentRequest(
        @NotNull Integer points,
        @NotBlank @Size(max = 255) String reason
) {
}
