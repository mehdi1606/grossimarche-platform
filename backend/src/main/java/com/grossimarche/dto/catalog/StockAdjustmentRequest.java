package com.grossimarche.dto.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Admin: adjust stock by a signed delta with a mandatory reason (written to audit_logs).
 */
public record StockAdjustmentRequest(
        @NotNull Integer delta,
        @NotBlank @Size(max = 255) String reason
) {
}
