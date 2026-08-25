package com.grossimarche.service;

import com.grossimarche.config.PricingProperties;
import com.grossimarche.entity.ProductPriceTier;
import com.grossimarche.entity.enums.CouponType;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * The single source of pricing truth. Catalogue, cart and checkout all resolve prices and
 * totals here - a second implementation anywhere is a defect. All money is
 * {@code BigDecimal} at scale 2, rounded HALF_UP at the boundary.
 */
@Service
public class PricingService {

    private final PricingProperties props;

    public PricingService(PricingProperties props) {
        this.props = props;
    }

    /**
     * The effective unit price for a quantity: the price of the highest tier whose
     * {@code minQuantity} the quantity reaches, or the base price if none applies.
     */
    public BigDecimal resolveUnitPrice(BigDecimal basePrice, List<ProductPriceTier> tiers, int quantity) {
        BigDecimal best = basePrice;
        int bestMin = 1;
        if (tiers != null) {
            for (ProductPriceTier tier : tiers) {
                if (quantity >= tier.getMinQuantity() && tier.getMinQuantity() >= bestMin) {
                    best = tier.getUnitPrice();
                    bestMin = tier.getMinQuantity();
                }
            }
        }
        return money(best);
    }

    public BigDecimal lineTotal(BigDecimal unitPrice, int quantity) {
        return money(unitPrice.multiply(BigDecimal.valueOf(quantity)));
    }

    /** Delivery fee with no known destination yet (cart preview): the flat rate. */
    public BigDecimal deliveryFee(BigDecimal subtotal) {
        return deliveryFee(subtotal, null);
    }

    /**
     * Delivery fee for a destination. The free-delivery threshold still wins - it can only
     * ever lower the bill - then the city's own rate applies, and any city without a
     * configured rate falls back to the flat fee.
     */
    public BigDecimal deliveryFee(BigDecimal subtotal, String city) {
        if (subtotal.compareTo(props.freeDeliveryThreshold()) >= 0) {
            return money(BigDecimal.ZERO);
        }
        BigDecimal cityFee = props.cityFees().get(normalizeCity(city));
        return money(cityFee != null ? cityFee : props.deliveryFee());
    }

    /**
     * City keys are configuration, typed by hand on both sides - match them on a normalized
     * form so "Casablanca", " casablanca " and "CASABLANCA" all resolve.
     */
    private String normalizeCity(String city) {
        if (city == null) {
            return "";
        }
        return java.text.Normalizer.normalize(city.trim().toLowerCase(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }

    /** Compute the order-level totals from the priced lines (flat delivery, no destination). */
    public Totals computeTotals(List<LinePricing> lines) {
        return computeTotals(lines, null);
    }

    /** Compute the order-level totals from the priced lines, delivered to {@code city}. */
    public Totals computeTotals(List<LinePricing> lines, String city) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discount = BigDecimal.ZERO;
        for (LinePricing line : lines) {
            BigDecimal qty = BigDecimal.valueOf(line.quantity());
            subtotal = subtotal.add(line.effectiveUnitPrice().multiply(qty));
            discount = discount.add(line.basePrice().subtract(line.effectiveUnitPrice()).multiply(qty));
        }
        subtotal = money(subtotal);
        discount = money(discount);
        BigDecimal delivery = deliveryFee(subtotal, city);
        BigDecimal total = money(subtotal.add(delivery));
        return new Totals(subtotal, discount, delivery, total);
    }

    /**
     * The discount a coupon yields on a goods subtotal: a percentage (optionally capped by
     * {@code maxDiscount}) or a fixed amount, clamped to {@code [0, subtotal]} so a coupon
     * can never make the goods go negative. Delivery is charged separately on the original
     * subtotal, so it is not passed here. The single place coupon money is computed.
     */
    public BigDecimal couponDiscount(CouponType type, BigDecimal value, BigDecimal maxDiscount,
                                     BigDecimal subtotal) {
        BigDecimal raw;
        if (type == CouponType.PERCENTAGE) {
            raw = subtotal.multiply(value).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (maxDiscount != null) {
                raw = raw.min(maxDiscount);
            }
        } else {
            raw = value;
        }
        raw = raw.max(BigDecimal.ZERO).min(subtotal);
        return money(raw);
    }

    public BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    /** A single line's pricing inputs for total computation. */
    public record LinePricing(BigDecimal basePrice, BigDecimal effectiveUnitPrice, int quantity) {
    }

    /** Server-computed order totals. */
    public record Totals(BigDecimal subtotal, BigDecimal discountTotal, BigDecimal deliveryFee,
                         BigDecimal total) {
    }
}
