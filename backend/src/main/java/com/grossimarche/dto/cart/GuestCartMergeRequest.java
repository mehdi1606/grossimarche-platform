package com.grossimarche.dto.cart;

import jakarta.validation.Valid;

import java.util.List;

/** Payload to merge a guest cart into the authenticated user's cart on login. */
public record GuestCartMergeRequest(
        @Valid List<GuestCartItem> items
) {
}
