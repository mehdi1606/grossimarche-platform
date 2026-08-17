package com.grossimarche.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Delivery-fee rules, config-driven so they can be tuned without a redeploy.
 *
 * @param deliveryFee            flat delivery fee (MAD), used for any city without its own rate
 * @param freeDeliveryThreshold  subtotal at or above which delivery is free
 * @param cityFees               per-city fee, keyed by lowercase unaccented city name
 */
@ConfigurationProperties(prefix = "grossimarche.pricing")
public record PricingProperties(
        @DefaultValue("30.00") BigDecimal deliveryFee,
        @DefaultValue("1000.00") BigDecimal freeDeliveryThreshold,
        Map<String, BigDecimal> cityFees
) {

    public PricingProperties {
        cityFees = cityFees == null ? Map.of() : Map.copyOf(cityFees);
    }
}
