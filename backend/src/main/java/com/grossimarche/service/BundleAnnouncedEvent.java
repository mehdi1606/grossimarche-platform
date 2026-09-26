package com.grossimarche.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Published when a bundle offer is announced to customers. Consumed by the mail layer, which is
 * why it carries everything the message needs - a listener must never have to re-read the offer
 * to write the e-mail, nor price it a second time.
 *
 * @param clientTypeIds the trades the offer is priced for, and therefore the only customers it
 *                      is on sale to. The announcement goes to them and to nobody else.
 * @param audience      those trades named, for the log and the back-office confirmation
 * @param items         the basket's contents, already priced for the trade it is sold to
 */
public record BundleAnnouncedEvent(
        UUID bundleId,
        String name,
        String slug,
        BigDecimal price,
        BigDecimal savings,
        List<UUID> clientTypeIds,
        String audience,
        List<Item> items
) {

    /**
     * One product in the announced basket.
     *
     * @param unit      how it is sold - "sac de 5 kg" - so a price has something to hang on
     * @param unitPrice what one costs this trade, at the rung the basket quantity earns
     * @param lineTotal what the basket's quantity of it comes to
     * @param rating    average of approved reviews, or 0 when there are none
     * @param reviews   how many approved reviews back that average; 0 means "no opinion yet",
     *                  which the e-mail says in words rather than drawing empty stars
     */
    public record Item(
            String name,
            String imageUrl,
            String unit,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal,
            double rating,
            long reviews
    ) {
    }
}
