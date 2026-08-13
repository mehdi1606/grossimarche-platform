package com.grossimarche.service;

import java.util.UUID;

/**
 * Published when a stock adjustment leaves a product at or below the low-stock threshold.
 * Drives the LOW_STOCK back-office notification. Consumed {@code AFTER_COMMIT}.
 */
public record LowStockEvent(
        UUID productId,
        String productName,
        int remainingStock
) {
}
