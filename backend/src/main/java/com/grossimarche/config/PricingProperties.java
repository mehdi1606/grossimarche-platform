package com.grossimarche.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.math.BigDecimal;

/**
 * Delivery-fee rules, config-driven so they can be tuned without a redeploy.
 *
 * @param deliveryFee            flat delivery fee (MAD)
 * @param freeDeliveryThreshold  subtotal at or above which delivery is free
 */
@ConfigurationProperties(prefix = "grossimarche.pricing")
public record PricingProperties(
        @DefaultValue("30.00") BigDecimal deliveryFee,
        @DefaultValue("500.00") BigDecimal freeDeliveryThreshold
) {
}
