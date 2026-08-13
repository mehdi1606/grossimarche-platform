package com.grossimarche.service;

import com.grossimarche.entity.enums.OrderStatus;

import java.util.UUID;

/**
 * Published (via {@code ApplicationEventPublisher}) whenever an order is created or changes
 * status. The WebSocket layer (B9) listens with {@code AFTER_COMMIT} so clients only ever
 * see committed state.
 */
public record OrderStatusChangedEvent(
        UUID orderId,
        String orderNumber,
        OrderStatus status,
        UUID userId,
        String message
) {
}
