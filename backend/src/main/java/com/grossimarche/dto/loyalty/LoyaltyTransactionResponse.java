package com.grossimarche.dto.loyalty;

import com.grossimarche.entity.enums.LoyaltyTransactionType;

import java.time.Instant;
import java.util.UUID;

/** One movement in the loyalty ledger, linked to its order where applicable. */
public record LoyaltyTransactionResponse(
        UUID id,
        int points,
        LoyaltyTransactionType type,
        UUID orderId,
        String note,
        Instant createdAt
) {
}
