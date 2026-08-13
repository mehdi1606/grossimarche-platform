package com.grossimarche.dto.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One day on the sales chart. */
public record SalesPointResponse(
        LocalDate date,
        BigDecimal revenue,
        long orders
) {
}
