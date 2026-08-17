package com.grossimarche.service;

import com.grossimarche.config.PricingProperties;
import com.grossimarche.entity.ProductPriceTier;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** Unit tests for the single pricing source of truth: tier resolution, fee, totals. */
class PricingServiceTest {

    private final PricingService pricing = new PricingService(
            new PricingProperties(new BigDecimal("30.00"), new BigDecimal("500.00"),
                    Map.of("mohammedia", new BigDecimal("0.00"),
                            "casablanca", new BigDecimal("20.00"))));

    private ProductPriceTier tier(int minQty, String price) {
        return ProductPriceTier.builder().minQuantity(minQty).unitPrice(new BigDecimal(price)).build();
    }

    @Test
    void resolveUnitPrice_walksTiersCorrectly() {
        BigDecimal base = new BigDecimal("100.00");
        List<ProductPriceTier> tiers = List.of(tier(10, "90.00"), tier(25, "80.00"));

        assertThat(pricing.resolveUnitPrice(base, tiers, 1)).isEqualByComparingTo("100.00");
        assertThat(pricing.resolveUnitPrice(base, tiers, 9)).isEqualByComparingTo("100.00");
        assertThat(pricing.resolveUnitPrice(base, tiers, 10)).isEqualByComparingTo("90.00");  // boundary
        assertThat(pricing.resolveUnitPrice(base, tiers, 24)).isEqualByComparingTo("90.00");
        assertThat(pricing.resolveUnitPrice(base, tiers, 25)).isEqualByComparingTo("80.00");  // boundary
        assertThat(pricing.resolveUnitPrice(base, tiers, 100)).isEqualByComparingTo("80.00");
        assertThat(pricing.resolveUnitPrice(base, List.of(), 50)).isEqualByComparingTo("100.00");
    }

    @Test
    void deliveryFee_waivedAtThreshold() {
        assertThat(pricing.deliveryFee(new BigDecimal("499.99"))).isEqualByComparingTo("30.00");
        assertThat(pricing.deliveryFee(new BigDecimal("500.00"))).isEqualByComparingTo("0.00");
        assertThat(pricing.deliveryFee(new BigDecimal("650.00"))).isEqualByComparingTo("0.00");
    }

    @Test
    void deliveryFee_usesTheCityRate() {
        BigDecimal under = new BigDecimal("100.00");
        assertThat(pricing.deliveryFee(under, "Mohammedia")).isEqualByComparingTo("0.00");
        assertThat(pricing.deliveryFee(under, "casablanca")).isEqualByComparingTo("20.00");
        // Casing and stray spacing must not change the rate.
        assertThat(pricing.deliveryFee(under, "  CASABLANCA ")).isEqualByComparingTo("20.00");
        // A city with no configured rate falls back to the flat fee.
        assertThat(pricing.deliveryFee(under, "Marrakech")).isEqualByComparingTo("30.00");
        assertThat(pricing.deliveryFee(under, null)).isEqualByComparingTo("30.00");
        // The free-delivery threshold still wins over any city rate.
        assertThat(pricing.deliveryFee(new BigDecimal("500.00"), "casablanca"))
                .isEqualByComparingTo("0.00");
    }

    @Test
    void computeTotals_sumsSubtotalDiscountAndDelivery() {
        // 10 units at tier price 90 (base 100) + 2 units at base 50 (no tier).
        var lines = List.of(
                new PricingService.LinePricing(new BigDecimal("100.00"), new BigDecimal("90.00"), 10),
                new PricingService.LinePricing(new BigDecimal("50.00"), new BigDecimal("50.00"), 2));

        PricingService.Totals totals = pricing.computeTotals(lines);

        assertThat(totals.subtotal()).isEqualByComparingTo("1000.00");   // 900 + 100
        assertThat(totals.discountTotal()).isEqualByComparingTo("100.00"); // (100-90)*10
        assertThat(totals.deliveryFee()).isEqualByComparingTo("0.00");    // 1000 >= 500
        assertThat(totals.total()).isEqualByComparingTo("1000.00");
    }
}
