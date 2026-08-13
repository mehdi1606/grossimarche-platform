package com.grossimarche.dto.order;

import java.math.BigDecimal;
import java.util.UUID;

/** A frozen order line (name/unit/price are snapshots taken at checkout). */
public record OrderItemResponse(
        UUID productId,
        String productName,
        String unit,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
