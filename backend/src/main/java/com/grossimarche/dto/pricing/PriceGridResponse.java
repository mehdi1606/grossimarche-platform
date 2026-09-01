package com.grossimarche.dto.pricing;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * A product's price grid for the back-office.
 *
 * Every active segment appears, priced or not. A segment with an empty ladder is the whole
 * point of showing it: that product is invisible to that segment, and an admin has to be able
 * to see the hole rather than discover it from a customer's empty catalogue.
 */
public record PriceGridResponse(
        UUID productId,
        String productName,
        /** The list price the back-office prices against. Never shown to a customer. */
        BigDecimal referencePrice,
        List<TypeGrid> grids
) {

    public record TypeGrid(
            UUID clientTypeId,
            String clientTypeName,
            boolean clientTypeActive,
            /** Empty when this segment has no price: the product does not exist for it. */
            List<Rung> rungs
    ) {

        public boolean priced() {
            return rungs != null && !rungs.isEmpty();
        }
    }

    public record Rung(int minQuantity, BigDecimal unitPrice) {
    }
}
