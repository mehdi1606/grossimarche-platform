package com.grossimarche.dto.bundle;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Create or replace a bundle offer.
 *
 * At least one component is required — a "bundle" of nothing is not an offer — but one is
 * enough: a single product at a promotional pack price is a perfectly good offer, so this is
 * deliberately not restricted to two or more.
 */
public record BundleRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 1000) String description,
        @Size(max = 500) String imageUrl,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        Boolean active,
        Instant startsAt,
        Instant endsAt,
        @NotEmpty @Valid List<BundleItemRequest> items
) {
}
