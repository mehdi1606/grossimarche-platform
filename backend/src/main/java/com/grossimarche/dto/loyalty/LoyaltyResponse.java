package com.grossimarche.dto.loyalty;

import com.grossimarche.entity.enums.LoyaltyTier;

/**
 * Loyalty summary. {@code pointsToNextTier} is 0 and {@code nextTier} null at the top tier.
 */
public record LoyaltyResponse(
        int pointsBalance,
        LoyaltyTier tier,
        int lifetimePoints,
        int pointsToNextTier,
        LoyaltyTier nextTier
) {
}
