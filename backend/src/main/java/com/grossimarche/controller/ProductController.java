package com.grossimarche.controller;

import com.grossimarche.dto.catalog.ProductDetailResponse;
import com.grossimarche.dto.catalog.ProductFilter;
import com.grossimarche.dto.catalog.ProductSummaryResponse;
import com.grossimarche.dto.common.PageResponse;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.service.ProductService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.UUID;

/** Public product search and detail. */
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private static final int MAX_PAGE_SIZE = 100;

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public PageResponse<ProductSummaryResponse> search(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(defaultValue = "relevance") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Le paramètre 'size' doit être compris entre 1 et " + MAX_PAGE_SIZE + ".");
        }
        Pageable pageable = PageRequest.of(page, size, sortFor(sort));
        ProductFilter filter = new ProductFilter(categoryId, q, minPrice, maxPrice, inStock);
        return PageResponse.from(productService.search(filter, pageable));
    }

    @GetMapping("/{idOrSlug}")
    public ProductDetailResponse detail(@PathVariable String idOrSlug) {
        return productService.getDetail(idOrSlug);
    }

    private Sort sortFor(String sort) {
        return switch (sort) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "name" -> Sort.by(Sort.Direction.ASC, "name");
            // "relevance" default: newest first (a full relevance rank would use the tsvector).
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }
}
