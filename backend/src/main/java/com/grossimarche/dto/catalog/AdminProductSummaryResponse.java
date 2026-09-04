package com.grossimarche.dto.catalog;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Product row for the back-office list. Unlike the public {@link ProductSummaryResponse} it
 * exposes management fields (raw stock, active flag, category) and includes inactive products.
 */
public record AdminProductSummaryResponse(
        UUID id,
        String name,
        /** Arabic name, so the back-office list can show what is still untranslated. */
        String nameAr,
        String slug,
        String description,
        BigDecimal price,
        String unit,
        String imageUrl,
        int stockQuantity,
        int minOrderQuantity,
        boolean active,
        UUID categoryId,
        String categoryName
) {
}
