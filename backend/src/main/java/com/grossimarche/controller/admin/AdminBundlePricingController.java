package com.grossimarche.controller.admin;

import com.grossimarche.dto.pricing.BundlePriceGridRequest;
import com.grossimarche.dto.pricing.BundlePriceGridResponse;
import com.grossimarche.service.BundlePricingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** What a bundle costs each segment, and what its components come to there. */
@RestController
@RequestMapping("/api/v1/admin/bundles/{bundleId}/price-grid")
public class AdminBundlePricingController {

    private final BundlePricingService pricingService;

    public AdminBundlePricingController(BundlePricingService pricingService) {
        this.pricingService = pricingService;
    }

    @GetMapping
    public BundlePriceGridResponse get(@PathVariable UUID bundleId) {
        return pricingService.getGrid(bundleId);
    }

    @PutMapping
    public BundlePriceGridResponse replace(@PathVariable UUID bundleId,
                                           @Valid @RequestBody BundlePriceGridRequest body) {
        return pricingService.replaceGrid(bundleId, body);
    }
}
