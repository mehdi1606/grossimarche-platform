package com.grossimarche.controller.admin;

import com.grossimarche.dto.bundle.BundleRequest;
import com.grossimarche.dto.bundle.BundleResponse;
import com.grossimarche.dto.common.PageResponse;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.service.BundleService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
import java.util.Map;
import java.util.UUID;

/** Bundle-offer management. Authorization is enforced on the service. */
@RestController
@RequestMapping("/api/v1/admin/bundles")
public class AdminBundleController {

    private final BundleService bundleService;

    public AdminBundleController(BundleService bundleService) {
        this.bundleService = bundleService;
    }

    @GetMapping
    public PageResponse<BundleResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return PageResponse.from(bundleService.listAll(PageRequest.of(page, Math.min(size, 100))));
    }

    @GetMapping("/{id}")
    public BundleResponse get(@PathVariable UUID id) {
        return bundleService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BundleResponse create(@Valid @RequestBody BundleRequest body) {
        return bundleService.create(body);
    }

    @PutMapping("/{id}")
    public BundleResponse update(@PathVariable UUID id, @Valid @RequestBody BundleRequest body) {
        return bundleService.update(id, body);
    }

    /**
     * Upload the offer's image. Same contract as the product uploader: multipart in, the
     * stored URL out, served from our own storage rather than a pasted third-party link.
     */
    @PostMapping("/{id}/image")
    public Map<String, String> uploadImage(@PathVariable UUID id,
                                           @RequestParam("file") MultipartFile file) {
        String url = bundleService.uploadImage(id, readBytes(file), file.getContentType(),
                file.getOriginalFilename());
        return Map.of("imageUrl", url);
    }

    /** Send the offer to customers by e-mail. Separate from saving, and never automatic. */
    @PostMapping("/{id}/announce")
    public BundleResponse announce(@PathVariable UUID id) {
        return bundleService.announce(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        bundleService.delete(id);
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
