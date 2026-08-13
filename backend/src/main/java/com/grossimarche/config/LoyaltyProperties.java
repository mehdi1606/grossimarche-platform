package com.grossimarche.config;

import com.grossimarche.entity.enums.LoyaltyTier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.math.BigDecimal;

/**
 * Loyalty rules, config-driven so they can be tuned without a redeploy: earn rate, tier
 * thresholds (by lifetime points) and per-tier earn multipliers.
 */
@ConfigurationProperties(prefix = "grossimarche.loyalty")
public record LoyaltyProperties(
        @DefaultValue("10") int madPerPoint,
        @DefaultValue("500") int argentThreshold,
        @DefaultValue("2000") int orThreshold,
        @DefaultValue("1.0") BigDecimal bronzeMultiplier,
        @DefaultValue("1.2") BigDecimal argentMultiplier,
        @DefaultValue("1.5") BigDecimal orMultiplier
) {

    public BigDecimal multiplierFor(LoyaltyTier tier) {
        return switch (tier) {
            case BRONZE -> bronzeMultiplier;
            case ARGENT -> argentMultiplier;
            case OR -> orMultiplier;
        };
    }

    public LoyaltyTier tierForLifetime(int lifetimePoints) {
        if (lifetimePoints >= orThreshold) {
            return LoyaltyTier.OR;
        }
        if (lifetimePoints >= argentThreshold) {
            return LoyaltyTier.ARGENT;
        }
        return LoyaltyTier.BRONZE;
    }
}
