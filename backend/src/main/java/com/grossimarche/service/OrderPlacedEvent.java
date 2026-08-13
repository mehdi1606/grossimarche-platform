package com.grossimarche.service;

import java.util.UUID;

/**
 * Published once when a shopper places an order (never on later status changes). Drives the
 * NEW_ORDER back-office notification. Consumed {@code AFTER_COMMIT} so a rolled-back checkout
 * notifies nobody.
 */
public record OrderPlacedEvent(
        UUID orderId,
        String orderNumber
) {
}
