package com.grossimarche.dto.mapper;

import com.grossimarche.dto.currency.CurrencyResponse;
import com.grossimarche.entity.Currency;
import org.springframework.stereotype.Component;

/** Currency entity → DTO. */
@Component
public class CurrencyMapper {

    public CurrencyResponse toResponse(Currency c) {
        return new CurrencyResponse(c.getId(), c.getCode(), c.getName(), c.getSymbol(),
                c.getExchangeRate(), c.isDefault(), c.isEnabled());
    }
}
