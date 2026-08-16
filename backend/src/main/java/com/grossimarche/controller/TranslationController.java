package com.grossimarche.controller;

import com.grossimarche.dto.translation.TranslateRequest;
import com.grossimarche.dto.translation.TranslateResponse;
import com.grossimarche.service.TranslationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public batch translation endpoint backed by the self-hosted LibreTranslate + Redis cache. */
@RestController
@RequestMapping("/api/v1/translate")
public class TranslationController {

    private final TranslationService translationService;

    public TranslationController(TranslationService translationService) {
        this.translationService = translationService;
    }

    @PostMapping
    public TranslateResponse translate(@Valid @RequestBody TranslateRequest req) {
        String source = (req.source() == null || req.source().isBlank()) ? "fr" : req.source();
        List<String> out = translationService.translateBatch(
                req.q() == null ? List.of() : req.q(), source, req.target());
        return new TranslateResponse(out);
    }
}
