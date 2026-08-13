package com.grossimarche.dto.currency;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Admin: create or update a currency. */
public record CurrencyRequest(
        @NotBlank @Size(max = 10) String code,
        @NotBlank @Size(max = 60) String name,
        @NotBlank @Size(max = 10) String symbol,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal exchangeRate,
        boolean isDefault,
        boolean enabled
) {
}
