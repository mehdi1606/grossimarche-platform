package com.grossimarche.dto.order;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Result of a checkout. For COD the order is already CONFIRMED and {@code payment} is null.
 * For CARD the order is PENDING and {@code payment} carries the CMI redirect.
 * {@code pointsEarned} is populated once points are awarded (immediately for COD).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OrderCreatedResponse(
        OrderDetailResponse order,
        CmiRedirectResponse payment,
        Integer pointsEarned
) {
}
