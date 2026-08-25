package com.grossimarche.dto.order;

import com.grossimarche.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Checkout request. The {@code Idempotency-Key} header (not part of this body) is required
 * and makes retries safe. Totals are never accepted from the client - the server recomputes.
 */
public record CreateOrderRequest(
        @NotNull UUID addressId,
        @NotNull PaymentMethod paymentMethod,
        @Size(max = 500) String note,
        @Size(max = 40) String couponCode
) {
}
