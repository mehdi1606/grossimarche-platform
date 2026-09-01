package com.grossimarche.entity.enums;

/** Account lifecycle state. */
public enum UserStatus {

    /**
     * Registered, waiting for the merchant to recognise the business.
     *
     * The account exists and its password works, but it can sign in to nothing and sees no
     * prices. Wholesale prices are per segment and confidential, so this gate is what stops a
     * competitor from reading the grid by filling in a form.
     */
    PENDING,

    ACTIVE,

    /** Turned down at validation. Distinct from BLOCKED, which suspends an account that traded. */
    REJECTED,

    BLOCKED,

    DELETED;

    /** Whether an account in this state may sign in and buy. */
    public boolean canTrade() {
        return this == ACTIVE;
    }
}
