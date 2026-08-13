package com.grossimarche.dto.mapper;

import com.grossimarche.dto.review.AdminReviewResponse;
import com.grossimarche.dto.review.ReviewResponse;
import com.grossimarche.entity.ProductReview;
import org.springframework.stereotype.Component;

/** ProductReview entity → DTO. Called within a transaction so lazy user/product resolve. */
@Component
public class ReviewMapper {

    public ReviewResponse toResponse(ProductReview r) {
        return new ReviewResponse(r.getId(), r.getRating(), r.getComment(),
                authorName(r), r.getCreatedAt());
    }

    public AdminReviewResponse toAdmin(ProductReview r) {
        return new AdminReviewResponse(r.getId(), r.getProduct().getId(), r.getProduct().getName(),
                r.getUser().getId(), authorName(r), r.getRating(), r.getComment(), r.isApproved(),
                r.getCreatedAt());
    }

    private String authorName(ProductReview r) {
        String name = r.getUser().getFullName();
        return (name == null || name.isBlank()) ? "Client" : name;
    }
}
