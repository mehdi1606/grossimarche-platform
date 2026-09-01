package com.grossimarche.dto.pricing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * What a bundle costs in each segment, as the back-office submits it.
 *
 * Replace-all, like the product grid: a segment omitted here no longer has the offer, and that
 * has to be expressible without a separate delete.
 */
public record BundlePriceGridRequest(
        @Valid List<TypePrice> prices
) {

    public record TypePrice(
            @NotNull UUID clientTypeId,
            @NotNull @DecimalMin("0.0") BigDecimal price
    ) {
    }
}
