package com.grossimarche.service;

import com.grossimarche.dto.language.LanguageRequest;
import com.grossimarche.dto.language.LanguageResponse;
import com.grossimarche.dto.mapper.LanguageMapper;
import com.grossimarche.entity.Language;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ConflictException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.LanguageRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Language configuration. Reads are public (the storefront lists enabled languages);
 * mutations are ADMIN-only. Exactly one language is the default at any time.
 */
@Service
public class LanguageService {

    private final LanguageRepository languageRepository;
    private final LanguageMapper languageMapper;

    public LanguageService(LanguageRepository languageRepository, LanguageMapper languageMapper) {
        this.languageRepository = languageRepository;
        this.languageMapper = languageMapper;
    }

    @Transactional(readOnly = true)
    public List<LanguageResponse> list(boolean enabledOnly) {
        List<Language> languages = enabledOnly
                ? languageRepository.findByEnabledTrueOrderByNameAsc()
                : languageRepository.findAllByOrderByNameAsc();
        return languages.stream().map(languageMapper::toResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LanguageResponse create(LanguageRequest req) {
        String iso = req.isoCode().trim().toLowerCase();
        if (languageRepository.existsByIsoCodeIgnoreCase(iso)) {
            throw new ConflictException("Une langue avec ce code ISO existe déjà.");
        }
        Language language = new Language();
        language.setIsoCode(iso);
        apply(language, req);
        if (languageRepository.findDefault().isEmpty()) {
            language.setDefault(true);
        }
        if (language.isDefault()) {
            clearExistingDefault(null);
            language.setDefault(true);
            language.setEnabled(true);
        }
        return languageMapper.toResponse(languageRepository.save(language));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LanguageResponse update(UUID id, LanguageRequest req) {
        Language language = getById(id);
        String iso = req.isoCode().trim().toLowerCase();
        languageRepository.findByIsoCodeIgnoreCase(iso)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new ConflictException("Une langue avec ce code ISO existe déjà.");
                });
        language.setIsoCode(iso);
        apply(language, req);
        if (req.isDefault()) {
            clearExistingDefault(id);
            language.setDefault(true);
            language.setEnabled(true);
        } else if (language.isDefault()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Définissez une autre langue par défaut avant de retirer celle-ci.");
        }
        return languageMapper.toResponse(language);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void delete(UUID id) {
        Language language = getById(id);
        if (language.isDefault()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Impossible de supprimer la langue par défaut.");
        }
        languageRepository.delete(language);
    }

    private void apply(Language language, LanguageRequest req) {
        language.setName(req.name().trim());
        language.setFlag(req.flag());
        language.setEnabled(req.enabled());
        language.setDefault(req.isDefault());
    }

    private void clearExistingDefault(UUID keepId) {
        languageRepository.findDefault()
                .filter(existing -> keepId == null || !existing.getId().equals(keepId))
                .ifPresent(existing -> {
                    existing.setDefault(false);
                    languageRepository.saveAndFlush(existing);
                });
    }

    private Language getById(UUID id) {
        return languageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Langue", id));
    }
}
