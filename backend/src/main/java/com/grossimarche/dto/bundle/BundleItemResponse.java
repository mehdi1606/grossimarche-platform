package com.grossimarche.dto.bundle;

import java.math.BigDecimal;
import java.util.UUID;

/** One component of a bundle, with enough product detail to render it without a second call. */
public record BundleItemResponse(
        UUID productId,
        String name,
        String slug,
        String unit,
        String imageUrl,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        int stockQuantity,
        boolean available
) {
}
