package com.grossimarche.controller;

import com.grossimarche.dto.common.PageResponse;
import com.grossimarche.dto.review.ReviewRequest;
import com.grossimarche.dto.review.ReviewResponse;
import com.grossimarche.security.SecurityUtils;
import com.grossimarche.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Product reviews: public listing (approved only), authenticated submission. */
@RestController
@RequestMapping("/api/v1/products/{productId}/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public PageResponse<ReviewResponse> list(
            @PathVariable UUID productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return PageResponse.from(reviewService.getReviews(productId, PageRequest.of(page, Math.min(size, 50))));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse submit(@PathVariable UUID productId, @Valid @RequestBody ReviewRequest body) {
        return reviewService.submit(SecurityUtils.currentUserId(), productId, body);
    }
}
