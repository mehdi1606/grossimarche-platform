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
 * totals here — a second implementation anywhere is a defect. All money is
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

    /** Flat delivery fee, waived at or above the free-delivery threshold. */
    public BigDecimal deliveryFee(BigDecimal subtotal) {
        return subtotal.compareTo(props.freeDeliveryThreshold()) >= 0
                ? money(BigDecimal.ZERO)
                : money(props.deliveryFee());
    }

    /** Compute the order-level totals from the priced lines. */
    public Totals computeTotals(List<LinePricing> lines) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discount = BigDecimal.ZERO;
        for (LinePricing line : lines) {
            BigDecimal qty = BigDecimal.valueOf(line.quantity());
            subtotal = subtotal.add(line.effectiveUnitPrice().multiply(qty));
            discount = discount.add(line.basePrice().subtract(line.effectiveUnitPrice()).multiply(qty));
        }
        subtotal = money(subtotal);
        discount = money(discount);
        BigDecimal delivery = deliveryFee(subtotal);
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
