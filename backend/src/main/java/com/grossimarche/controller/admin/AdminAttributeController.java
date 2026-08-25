package com.grossimarche.controller.admin;

import com.grossimarche.dto.attribute.AttributeRequest;
import com.grossimarche.dto.attribute.AttributeResponse;
import com.grossimarche.service.AttributeService;
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

/**
 * Admin attribute-catalogue CRUD (STORE_MANAGER + ADMIN - part of catalogue management).
 * Values are managed together with their parent attribute in a single payload.
 */
@RestController
@RequestMapping("/api/v1/admin/attributes")
public class AdminAttributeController {

    private final AttributeService attributeService;

    public AdminAttributeController(AttributeService attributeService) {
        this.attributeService = attributeService;
    }

    @GetMapping
    public List<AttributeResponse> list() {
        return attributeService.list(false);
    }

    @GetMapping("/{id}")
    public AttributeResponse get(@PathVariable UUID id) {
        return attributeService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AttributeResponse create(@Valid @RequestBody AttributeRequest body) {
        return attributeService.create(body);
    }

    @PutMapping("/{id}")
    public AttributeResponse update(@PathVariable UUID id, @Valid @RequestBody AttributeRequest body) {
        return attributeService.update(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        attributeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
