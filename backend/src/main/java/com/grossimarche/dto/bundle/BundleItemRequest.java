package com.grossimarche.dto.bundle;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/** One component when creating or updating a bundle. */
public record BundleItemRequest(
        @NotNull UUID productId,
        @Min(1) int quantity
) {
}
