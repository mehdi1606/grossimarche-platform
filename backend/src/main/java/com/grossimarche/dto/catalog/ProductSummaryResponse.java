package com.grossimarche.dto.catalog;

import java.math.BigDecimal;
import java.util.UUID;

/** Compact product view for grids and lists. */
public record ProductSummaryResponse(
        UUID id,
        String name,
        String slug,
        BigDecimal price,
        String unit,
        String imageUrl,
        boolean inStock,
        boolean hasQuantityDiscount
) {
}
