package com.grossimarche.service;

import com.grossimarche.dto.currency.CurrencyRequest;
import com.grossimarche.dto.currency.CurrencyResponse;
import com.grossimarche.dto.mapper.CurrencyMapper;
import com.grossimarche.entity.Currency;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ConflictException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.CurrencyRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Currency configuration. Reads are public (the storefront needs the active currency);
 * mutations are ADMIN-only. Exactly one currency is the default at any time, and the default
 * always has an exchange rate of 1.
 */
@Service
public class CurrencyService {

    private final CurrencyRepository currencyRepository;
    private final CurrencyMapper currencyMapper;

    public CurrencyService(CurrencyRepository currencyRepository, CurrencyMapper currencyMapper) {
        this.currencyRepository = currencyRepository;
        this.currencyMapper = currencyMapper;
    }

    @Transactional(readOnly = true)
    public List<CurrencyResponse> list(boolean enabledOnly) {
        List<Currency> currencies = enabledOnly
                ? currencyRepository.findByEnabledTrueOrderByCodeAsc()
                : currencyRepository.findAllByOrderByCodeAsc();
        return currencies.stream().map(currencyMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CurrencyResponse getDefault() {
        return currencyMapper.toResponse(currencyRepository.findDefault()
                .orElseThrow(() -> new ResourceNotFoundException("Aucune devise par défaut configurée.")));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public CurrencyResponse create(CurrencyRequest req) {
        String code = req.code().trim().toUpperCase();
        if (currencyRepository.existsByCodeIgnoreCase(code)) {
            throw new ConflictException("Une devise avec ce code existe déjà.");
        }
        Currency currency = new Currency();
        currency.setCode(code);
        apply(currency, req);
        // The very first currency created must be the default.
        if (currencyRepository.findDefault().isEmpty()) {
            currency.setDefault(true);
        }
        if (currency.isDefault()) {
            clearExistingDefault(null);
            currency.setExchangeRate(BigDecimal.ONE);
            currency.setEnabled(true);
        }
        return currencyMapper.toResponse(currencyRepository.save(currency));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public CurrencyResponse update(UUID id, CurrencyRequest req) {
        Currency currency = getById(id);
        String code = req.code().trim().toUpperCase();
        currencyRepository.findByCodeIgnoreCase(code)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new ConflictException("Une devise avec ce code existe déjà.");
                });
        currency.setCode(code);
        apply(currency, req);
        if (req.isDefault()) {
            clearExistingDefault(id);
            currency.setDefault(true);
            currency.setExchangeRate(BigDecimal.ONE);
            currency.setEnabled(true);
        } else if (currency.isDefault()) {
            // Cannot silently unset the only default - a default must always exist.
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Définissez une autre devise par défaut avant de retirer celle-ci.");
        }
        return currencyMapper.toResponse(currency);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void delete(UUID id) {
        Currency currency = getById(id);
        if (currency.isDefault()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Impossible de supprimer la devise par défaut.");
        }
        currencyRepository.delete(currency);
    }

    private void apply(Currency currency, CurrencyRequest req) {
        currency.setName(req.name().trim());
        currency.setSymbol(req.symbol().trim());
        currency.setExchangeRate(req.exchangeRate());
        currency.setEnabled(req.enabled());
        currency.setDefault(req.isDefault());
    }

    /** Unset the current default (if any and different from {@code keepId}) and flush first. */
    private void clearExistingDefault(UUID keepId) {
        currencyRepository.findDefault()
                .filter(existing -> keepId == null || !existing.getId().equals(keepId))
                .ifPresent(existing -> {
                    existing.setDefault(false);
                    currencyRepository.saveAndFlush(existing); // release the partial unique index
                });
    }

    private Currency getById(UUID id) {
        return currencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devise", id));
    }
}
