package com.grossimarche.dto.bundle;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A bundle offer as the storefront and the back-office see it.
 *
 * {@code componentsTotal} is the sum of the components at their current list prices, so
 * {@code savings} and {@code savingsPercent} are derived from live pricing rather than from a
 * number frozen when the offer was written - a product price change is reflected immediately.
 *
 * {@code available} is false when a component is out of stock or has been deactivated: the
 * offer is still shown, but the storefront can say why it cannot be ordered instead of failing
 * at checkout.
 */
public record BundleResponse(
        UUID id,
        String name,
        /** Arabic name, or null when this offer has not been translated yet. */
        String nameAr,
        String slug,
        String description,
        /** Arabic description, or null when it has not been translated yet. */
        String descriptionAr,
        String imageUrl,
        /**
         * Whose prices the figures below are. Null for a shopper, who is only ever shown their
         * own and does not need them named; filled for the back-office, where a bundle belongs
         * to one trade and every amount is meaningless without saying which.
         */
        String clientTypeName,
        BigDecimal price,
        BigDecimal componentsTotal,
        BigDecimal savings,
        int savingsPercent,
        boolean active,
        boolean available,
        Instant startsAt,
        Instant endsAt,
        List<BundleItemResponse> items,
        Instant createdAt
) {
}
