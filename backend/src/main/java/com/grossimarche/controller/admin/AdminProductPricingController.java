package com.grossimarche.controller.admin;

import com.grossimarche.dto.pricing.PriceGridRequest;
import com.grossimarche.dto.pricing.PriceGridResponse;
import com.grossimarche.service.ProductPricingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * What each segment pays for a product.
 *
 * Sits under /admin/products/{id}/price-grid rather than inside the product payload: the grid
 * grows with the number of segments, and an admin editing prices is doing a different job from
 * one editing a description or a photo.
 */
@RestController
@RequestMapping("/api/v1/admin/products/{productId}/price-grid")
public class AdminProductPricingController {

    private final ProductPricingService pricingService;

    public AdminProductPricingController(ProductPricingService pricingService) {
        this.pricingService = pricingService;
    }

    @GetMapping
    public PriceGridResponse get(@PathVariable UUID productId) {
        return pricingService.getGrid(productId);
    }

    /** Replace the whole grid. Anything the form omits was deleted by the admin. */
    @PutMapping
    public PriceGridResponse replace(@PathVariable UUID productId,
                                     @Valid @RequestBody PriceGridRequest body) {
        return pricingService.replaceGrid(productId, body);
    }
}
