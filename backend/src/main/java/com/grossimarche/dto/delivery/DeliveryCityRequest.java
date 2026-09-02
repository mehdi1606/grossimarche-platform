package com.grossimarche.dto.delivery;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * Create or replace a delivered city, districts included.
 *
 * The districts are submitted whole rather than one call each: the back-office edits a round as
 * one thing, and a half-applied edit leaves a city missing the district a customer is waiting
 * in.
 */
public record DeliveryCityRequest(
        @NotBlank @Size(max = 100) String name,
        /** Zero is allowed and means free delivery on this round. */
        @NotNull @DecimalMin("0.0") BigDecimal deliveryFee,
        @PositiveOrZero Integer sortOrder,
        Boolean active,
        @Valid List<District> districts
) {

    /** {@code deliveryFee} null means "same rate as the city", which is the common case. */
    public record District(
            @NotBlank @Size(max = 120) String name,
            @DecimalMin("0.0") BigDecimal deliveryFee,
            Boolean active
    ) {
    }
}
