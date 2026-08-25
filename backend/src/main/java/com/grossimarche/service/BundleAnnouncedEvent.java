package com.grossimarche.service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Published when an admin deliberately announces a bundle offer to customers. Consumed by the
 * mail layer, which is why it carries everything the message needs - a listener must never have
 * to re-read the offer to write the e-mail.
 */
public record BundleAnnouncedEvent(
        UUID bundleId,
        String name,
        String slug,
        BigDecimal price,
        BigDecimal savings
) {
}
