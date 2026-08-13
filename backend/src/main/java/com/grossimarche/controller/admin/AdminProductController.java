package com.grossimarche.controller.admin;

import com.grossimarche.dto.catalog.AdminProductSummaryResponse;
import com.grossimarche.dto.catalog.CsvImportReport;
import com.grossimarche.dto.catalog.PriceTierRequest;
import com.grossimarche.dto.catalog.PriceTierResponse;
import com.grossimarche.dto.catalog.ProductAttributeRequest;
import com.grossimarche.dto.catalog.ProductAttributeResponse;
import com.grossimarche.dto.catalog.ProductDetailResponse;
import com.grossimarche.dto.catalog.ProductFilter;
import com.grossimarche.dto.catalog.ProductRequest;
import com.grossimarche.dto.catalog.StockAdjustmentRequest;
import com.grossimarche.dto.common.PageResponse;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.security.SecurityUtils;
import com.grossimarche.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Admin product CRUD, price tiers, stock, image upload and CSV import. */
@RestController
@RequestMapping("/api/v1/admin/products")
public class AdminProductController {

    private final ProductService productService;

    public AdminProductController(ProductService productService) {
        this.productService = productService;
    }

    /** Back-office product listing (includes inactive products). */
    @GetMapping
    public PageResponse<AdminProductSummaryResponse> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        ProductFilter filter = new ProductFilter(categoryId, q, minPrice, maxPrice, inStock);
        return PageResponse.from(productService.adminList(filter, pageable));
    }

    @GetMapping("/{id}")
    public ProductDetailResponse detail(@PathVariable UUID id) {
        return productService.adminGetDetail(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDetailResponse create(@Valid @RequestBody ProductRequest body) {
        return productService.create(body);
    }

    @PutMapping("/{id}")
    public ProductDetailResponse update(@PathVariable UUID id, @Valid @RequestBody ProductRequest body) {
        return productService.update(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        productService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/stock")
    public ProductDetailResponse adjustStock(@PathVariable UUID id,
                                             @Valid @RequestBody StockAdjustmentRequest body) {
        return productService.adjustStock(id, body.delta(), body.reason(), SecurityUtils.currentUserId());
    }

    @GetMapping("/{id}/tiers")
    public List<PriceTierResponse> listTiers(@PathVariable UUID id) {
        return productService.listTiers(id);
    }

    @PostMapping("/{id}/tiers")
    @ResponseStatus(HttpStatus.CREATED)
    public PriceTierResponse addTier(@PathVariable UUID id, @Valid @RequestBody PriceTierRequest body) {
        return productService.addTier(id, body);
    }

    @DeleteMapping("/{id}/tiers/{tierId}")
    public ResponseEntity<Void> deleteTier(@PathVariable UUID id, @PathVariable UUID tierId) {
        productService.deleteTier(id, tierId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/image")
    public Map<String, String> uploadImage(@PathVariable UUID id,
                                           @RequestParam("file") MultipartFile file) {
        byte[] content = readBytes(file);
        String url = productService.uploadImage(id, content, file.getContentType(),
                file.getOriginalFilename());
        return Map.of("imageUrl", url);
    }

    @PostMapping("/import")
    public CsvImportReport importCsv(@RequestParam("file") MultipartFile file) {
        return productService.importCsv(new String(readBytes(file), StandardCharsets.UTF_8));
    }

    // ---- Informational attributes -----------------------------------------------------

    @GetMapping("/{id}/attributes")
    public List<ProductAttributeResponse> listAttributes(@PathVariable UUID id) {
        return productService.listAttributes(id);
    }

    @PostMapping("/{id}/attributes")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductAttributeResponse addAttribute(@PathVariable UUID id,
                                                 @Valid @RequestBody ProductAttributeRequest body) {
        return productService.addAttribute(id, body);
    }

    @PutMapping("/{id}/attributes/{attributeId}")
    public ProductAttributeResponse updateAttribute(@PathVariable UUID id,
                                                    @PathVariable UUID attributeId,
                                                    @Valid @RequestBody ProductAttributeRequest body) {
        return productService.updateAttribute(id, attributeId, body);
    }

    @DeleteMapping("/{id}/attributes/{attributeId}")
    public ResponseEntity<Void> deleteAttribute(@PathVariable UUID id, @PathVariable UUID attributeId) {
        productService.deleteAttribute(id, attributeId);
        return ResponseEntity.noContent().build();
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Fichier illisible.");
        }
    }
}
