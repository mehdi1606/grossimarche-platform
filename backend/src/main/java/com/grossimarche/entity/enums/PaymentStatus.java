package com.grossimarche.entity.enums;

/** Payment state, distinct from the order status. */
public enum PaymentStatus {
    /** CARD order created, waiting for the customer to pay at CMI. */
    AWAITING_PAYMENT,
    /** COD order: cash to be collected by the driver. */
    PENDING_ON_DELIVERY,
    PAID,
    FAILED,
    REFUNDED
}
