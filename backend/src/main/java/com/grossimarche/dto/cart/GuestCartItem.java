package com.grossimarche.dto.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/** One line of a guest cart, sent at login to be merged into the account cart. */
public record GuestCartItem(
        @NotNull UUID productId,
        @Min(1) int quantity
) {
}
