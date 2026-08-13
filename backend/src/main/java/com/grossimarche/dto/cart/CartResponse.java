package com.grossimarche.dto.cart;

import java.math.BigDecimal;
import java.util.List;

/** The current cart with server-computed totals. All amounts come from PricingService. */
public record CartResponse(
        List<CartItemResponse> items,
        BigDecimal subtotal,
        BigDecimal discountTotal,
        BigDecimal deliveryFee,
        BigDecimal total
) {
}
