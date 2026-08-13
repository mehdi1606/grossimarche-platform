package com.grossimarche.controller.admin;

import com.grossimarche.dto.language.LanguageRequest;
import com.grossimarche.dto.language.LanguageResponse;
import com.grossimarche.service.LanguageService;
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

/** Admin language configuration (ADMIN only — enforced by URL rules and service @PreAuthorize). */
@RestController
@RequestMapping("/api/v1/admin/languages")
public class AdminLanguageController {

    private final LanguageService languageService;

    public AdminLanguageController(LanguageService languageService) {
        this.languageService = languageService;
    }

    @GetMapping
    public List<LanguageResponse> list() {
        return languageService.list(false);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LanguageResponse create(@Valid @RequestBody LanguageRequest body) {
        return languageService.create(body);
    }

    @PutMapping("/{id}")
    public LanguageResponse update(@PathVariable UUID id, @Valid @RequestBody LanguageRequest body) {
        return languageService.update(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        languageService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
