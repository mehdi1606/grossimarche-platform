package com.grossimarche.repository.spec;

import com.grossimarche.entity.Product;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Composable {@link Specification} predicates for product queries. Each factory returns
 * {@code null} when its argument is absent, so callers can pass them straight into
 * {@link Specification#allOf} and unset filters are simply skipped.
 *
 * <p>Accent-insensitive matching reuses the {@code f_unaccent} SQL function (see V1).
 * Relevance-ranked full-text search over the {@code search_vector} column is added in B5;
 * this class provides the structured filters (category, price, stock, active).
 */
public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> active(Boolean active) {
        if (active == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("active"), active);
    }

    public static Specification<Product> inCategory(UUID categoryId) {
        if (categoryId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Product> priceAtLeast(BigDecimal minPrice) {
        if (minPrice == null) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("price"), minPrice);
    }

    public static Specification<Product> priceAtMost(BigDecimal maxPrice) {
        if (maxPrice == null) {
            return null;
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), maxPrice);
    }

    public static Specification<Product> inStock(Boolean inStock) {
        if (inStock == null || !inStock) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThan(root.get("stockQuantity"), 0);
    }

    /**
     * Accent-insensitive substring match over name + description, e.g. "the" finds "thé".
     * Both sides are pushed through {@code f_unaccent(lower(...))} so the comparison is
     * both case- and accent-insensitive.
     */
    public static Specification<Product> matchesText(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        String pattern = "%" + q.trim().toLowerCase() + "%";
        return (root, query, cb) -> {
            var nameU = cb.function("f_unaccent", String.class, cb.lower(root.get("name")));
            var descU = cb.function("f_unaccent", String.class,
                    cb.lower(cb.coalesce(root.get("description"), cb.literal(""))));
            var termU = cb.function("f_unaccent", String.class, cb.literal(pattern));
            return cb.or(cb.like(nameU, termU), cb.like(descU, termU));
        };
    }
}
