package com.grossimarche.dto.pricing;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * A bundle's price in every segment, for the back-office.
 *
 * Each row carries what the components come to in that segment, so the admin can see whether
 * the bundle price is actually a discount there. The same figure is a different number in each
 * segment, because the components themselves cost each of them something different.
 */
public record BundlePriceGridResponse(
        UUID bundleId,
        String bundleName,
        List<TypePrice> prices
) {

    public record TypePrice(
            UUID clientTypeId,
            String clientTypeName,
            boolean clientTypeActive,
            /** Null when the bundle has no price for this segment: it is not offered to it. */
            BigDecimal price,
            /**
             * What the components cost in this segment, or null when at least one of them has
             * no price here - in which case the bundle cannot be offered to this segment at all.
             */
            BigDecimal componentsTotal,
            /** Components with no price in this segment, named so the admin can go fix them. */
            List<String> unpricedComponents
    ) {

        /** A bundle that saves nothing is a pricing mistake, not an offer. */
        public BigDecimal savings() {
            if (price == null || componentsTotal == null) {
                return null;
            }
            return componentsTotal.subtract(price);
        }
    }
}
