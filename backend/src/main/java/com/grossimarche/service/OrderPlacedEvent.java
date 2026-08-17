package com.grossimarche.service;

import com.grossimarche.entity.enums.PaymentMethod;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Published once when a shopper places an order (never on later status changes). Drives the
 * NEW_ORDER back-office notification. Consumed {@code AFTER_COMMIT} so a rolled-back checkout
 * notifies nobody.
 *
 * The event carries the order summary rather than just its id: the listener runs after the
 * transaction has committed and has no repository of its own, so anything it needs to write
 * in the notification must travel with the event.
 */
public record OrderPlacedEvent(
        UUID orderId,
        String orderNumber,
        String customerName,
        String city,
        int itemCount,
        int unitCount,
        BigDecimal total,
        PaymentMethod paymentMethod
) {
}
