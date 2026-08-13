package com.grossimarche.dto.catalog;

import java.math.BigDecimal;

/** One quantity-discount tier: from {@code minQuantity} units, the unit price applies. */
public record PriceTierResponse(
        int minQuantity,
        BigDecimal unitPrice
) {
}
