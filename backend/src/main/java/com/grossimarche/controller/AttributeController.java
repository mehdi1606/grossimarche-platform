package com.grossimarche.controller;

import com.grossimarche.dto.attribute.AttributeResponse;
import com.grossimarche.service.AttributeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public attribute listing for the storefront (enabled attributes with their values). */
@RestController
@RequestMapping("/api/v1/attributes")
public class AttributeController {

    private final AttributeService attributeService;

    public AttributeController(AttributeService attributeService) {
        this.attributeService = attributeService;
    }

    @GetMapping
    public List<AttributeResponse> list() {
        return attributeService.list(true);
    }
}
