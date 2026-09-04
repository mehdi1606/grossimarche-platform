package com.grossimarche.dto.catalog;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Query filters for a product search. Any field may be null (unset).
 *
 * {@code clientTypeId} keeps only the products carrying a price for that segment. The storefront
 * applies it implicitly, from whoever is signed in; the back-office passes it explicitly when it
 * is building something for one trade - a bundle cannot hold a product that segment is not sold.
 *
 * The five-argument constructor is kept so the callers that do not care about a segment read as
 * they did before.
 */
public record ProductFilter(
        UUID categoryId,
        String q,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Boolean inStock,
        UUID clientTypeId
) {

    public ProductFilter(UUID categoryId, String q, BigDecimal minPrice, BigDecimal maxPrice,
                         Boolean inStock) {
        this(categoryId, q, minPrice, maxPrice, inStock, null);
    }
}
