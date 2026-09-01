package com.grossimarche.dto.pricing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * A product's complete price grid, as the back-office submits it.
 *
 * Replace-all, not patch: the form owns the whole grid, so sending it back is the only way to
 * express "this segment no longer has a rung at 8" without a second delete call that could
 * half-apply.
 *
 * A segment absent from {@code grids}, or present with no rungs, means the product is not sold
 * to it - and is therefore invisible to it. There is no price to fall back to.
 */
public record PriceGridRequest(
        @Valid List<TypeGrid> grids
) {

    /** One segment's ladder. */
    public record TypeGrid(
            @NotNull UUID clientTypeId,
            @Valid List<Rung> rungs
    ) {
    }

    /**
     * One rung: from {@code minQuantity} units, each unit costs {@code unitPrice}.
     *
     * {@code minQuantity = 1} is the segment's base price. A ladder that starts higher is a
     * minimum order, not a mistake - some segments only buy by the case.
     */
    public record Rung(
            @NotNull @Min(1) Integer minQuantity,
            @NotNull @DecimalMin("0.0") BigDecimal unitPrice
    ) {
    }
}
