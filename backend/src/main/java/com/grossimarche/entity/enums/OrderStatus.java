package com.grossimarche.entity.enums;

/**
 * Order lifecycle. Legal flow:
 * {@code PENDING → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED}, with
 * {@code CANCELLED} reachable from any non-terminal state. The allowed transitions are
 * enforced by a state machine in the service layer (B6).
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PREPARING,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED
}
