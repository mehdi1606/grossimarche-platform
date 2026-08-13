package com.grossimarche.entity.enums;

/** Kind of movement in the loyalty ledger. Balance = sum of all transactions' points. */
public enum LoyaltyTransactionType {
    EARNED,
    REVERSED,
    ADJUSTED,
    SPENT
}
