package com.grossimarche.dto.currency;

import java.math.BigDecimal;
import java.util.UUID;

/** A currency as returned by the API. */
public record CurrencyResponse(
        UUID id,
        String code,
        String name,
        String symbol,
        BigDecimal exchangeRate,
        boolean isDefault,
        boolean enabled
) {
}
