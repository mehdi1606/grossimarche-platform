package com.grossimarche.entity.enums;

/** How the customer pays. COD is the default and needs no third-party integration. */
public enum PaymentMethod {
    /** Cash on delivery (paiement à la livraison). */
    COD,
    /** Moroccan bank card via the CMI gateway. */
    CARD
}
