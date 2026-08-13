package com.grossimarche.dto.dashboard;

import java.math.BigDecimal;
import java.util.UUID;

/** A top-selling product over the reporting window (from frozen order lines). */
public record BestSellerResponse(
        UUID productId,
        String name,
        Long quantitySold,
        BigDecimal revenue
) {
}
