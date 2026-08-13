package com.grossimarche.websocket;

import com.grossimarche.entity.enums.OrderStatus;

import java.time.Instant;
import java.util.UUID;

/** The payload pushed to subscribers when an order's status changes. */
public record OrderStatusEvent(
        UUID orderId,
        String orderNumber,
        OrderStatus status,
        Instant changedAt,
        String message
) {
}
