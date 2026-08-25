package com.grossimarche.dto.catalog;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * One quantity-discount tier: from {@code minQuantity} units, the unit price applies. The id
 * is exposed because DELETE /admin/products/{id}/tiers/{tierId} needs it - without it a
 * client can create tiers but never remove one.
 */
public record PriceTierResponse(
        UUID id,
        int minQuantity,
        BigDecimal unitPrice
) {
}
