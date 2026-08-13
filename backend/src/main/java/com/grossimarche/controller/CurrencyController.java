package com.grossimarche.controller;

import com.grossimarche.dto.currency.CurrencyResponse;
import com.grossimarche.service.CurrencyService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public currency listing for the storefront (enabled currencies + the active default). */
@RestController
@RequestMapping("/api/v1/currencies")
public class CurrencyController {

    private final CurrencyService currencyService;

    public CurrencyController(CurrencyService currencyService) {
        this.currencyService = currencyService;
    }

    @GetMapping
    public List<CurrencyResponse> list() {
        return currencyService.list(true);
    }

    @GetMapping("/default")
    public CurrencyResponse getDefault() {
        return currencyService.getDefault();
    }
}
