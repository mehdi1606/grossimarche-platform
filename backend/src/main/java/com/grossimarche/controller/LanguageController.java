package com.grossimarche.controller;

import com.grossimarche.dto.language.LanguageResponse;
import com.grossimarche.service.LanguageService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public language listing for the storefront (enabled languages only). */
@RestController
@RequestMapping("/api/v1/languages")
public class LanguageController {

    private final LanguageService languageService;

    public LanguageController(LanguageService languageService) {
        this.languageService = languageService;
    }

    @GetMapping
    public List<LanguageResponse> list() {
        return languageService.list(true);
    }
}
