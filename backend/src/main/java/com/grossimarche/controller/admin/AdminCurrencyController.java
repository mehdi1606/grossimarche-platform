package com.grossimarche.controller.admin;

import com.grossimarche.dto.currency.CurrencyRequest;
import com.grossimarche.dto.currency.CurrencyResponse;
import com.grossimarche.service.CurrencyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Admin currency configuration (ADMIN only - enforced by URL rules and service @PreAuthorize). */
@RestController
@RequestMapping("/api/v1/admin/currencies")
public class AdminCurrencyController {

    private final CurrencyService currencyService;

    public AdminCurrencyController(CurrencyService currencyService) {
        this.currencyService = currencyService;
    }

    @GetMapping
    public List<CurrencyResponse> list() {
        return currencyService.list(false);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CurrencyResponse create(@Valid @RequestBody CurrencyRequest body) {
        return currencyService.create(body);
    }

    @PutMapping("/{id}")
    public CurrencyResponse update(@PathVariable UUID id, @Valid @RequestBody CurrencyRequest body) {
        return currencyService.update(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        currencyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
