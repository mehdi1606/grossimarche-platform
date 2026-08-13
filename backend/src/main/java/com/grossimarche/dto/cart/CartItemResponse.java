package com.grossimarche.dto.cart;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * A cart line with server-computed pricing. {@code priceChanged} flags a base-price move
 * since the line was added; {@code stockIssue} flags quantity now exceeding available stock.
 */
public record CartItemResponse(
        UUID productId,
        String name,
        String unit,
        String imageUrl,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal effectiveUnitPrice,
        BigDecimal lineTotal,
        int availableStock,
        boolean priceChanged,
        boolean stockIssue
) {
}
