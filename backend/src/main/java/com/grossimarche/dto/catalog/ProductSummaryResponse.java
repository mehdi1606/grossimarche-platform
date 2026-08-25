package com.grossimarche.dto.catalog;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Compact product view for grids and lists.
 *
 * The quantity tiers travel with the summary, not just the {@code hasQuantityDiscount} flag.
 * A shopper adds to the cart straight from a grid, and the cart has to show the degressive
 * price the order will actually be charged - with only a boolean it would display the base
 * price for a quantity that has already earned a lower one.
 */
public record ProductSummaryResponse(
        UUID id,
        String name,
        String slug,
        BigDecimal price,
        String unit,
        String imageUrl,
        boolean inStock,
        boolean hasQuantityDiscount,
        List<PriceTierResponse> priceTiers,
        int minOrderQuantity
) {
}
