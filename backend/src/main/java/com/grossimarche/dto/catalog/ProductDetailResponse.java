package com.grossimarche.dto.catalog;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Full product detail, including the quantity-discount tiers. */
public record ProductDetailResponse(
        UUID id,
        String name,
        /** Arabic name, or null when this product has not been translated yet. */
        String nameAr,
        String slug,
        String description,
        /** Arabic description, or null when it has not been translated yet. */
        String descriptionAr,
        BigDecimal price,
        String unit,
        int stockQuantity,
        int minOrderQuantity,
        String imageUrl,
        boolean active,
        UUID categoryId,
        String categoryName,
        List<PriceTierResponse> priceTiers,
        List<ProductAttributeResponse> attributes,
        double averageRating,
        long reviewCount
) {
}
