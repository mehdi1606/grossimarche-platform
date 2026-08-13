package com.grossimarche.dto.catalog;

import java.math.BigDecimal;
import java.util.UUID;

/** Query filters for the public product search. Any field may be null (unset). */
public record ProductFilter(
        UUID categoryId,
        String q,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Boolean inStock
) {
}
