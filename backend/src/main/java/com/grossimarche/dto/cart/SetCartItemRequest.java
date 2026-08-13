package com.grossimarche.dto.cart;

import jakarta.validation.constraints.Min;

/** Set a cart line's quantity. 0 removes the line. Lower/upper bounds enforced in service. */
public record SetCartItemRequest(
        @Min(0) int quantity
) {
}
