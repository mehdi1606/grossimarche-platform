package com.grossimarche.controller;

import com.grossimarche.dto.bundle.BundleResponse;
import com.grossimarche.service.BundleService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Public catalogue of bundle offers ("paniers") shown on the storefront. */
@RestController
@RequestMapping("/api/v1/bundles")
public class BundleController {

    private final BundleService bundleService;

    public BundleController(BundleService bundleService) {
        this.bundleService = bundleService;
    }

    /** Every offer orderable right now, or only those containing {@code productId}. */
    @GetMapping
    public List<BundleResponse> list(@RequestParam(required = false) UUID productId) {
        return productId == null
                ? bundleService.listAvailable()
                : bundleService.listContainingProduct(productId);
    }

    @GetMapping("/{slug}")
    public BundleResponse detail(@PathVariable String slug) {
        return bundleService.getBySlug(slug);
    }
}
