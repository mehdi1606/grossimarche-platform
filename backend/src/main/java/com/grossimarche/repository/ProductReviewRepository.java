package com.grossimarche.repository;

import com.grossimarche.entity.ProductReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface ProductReviewRepository extends JpaRepository<ProductReview, UUID> {

    Page<ProductReview> findByProductIdAndApprovedTrueOrderByCreatedAtDesc(UUID productId, Pageable pageable);

    Optional<ProductReview> findByProductIdAndUserId(UUID productId, UUID userId);

    long countByProductIdAndApprovedTrue(UUID productId);

    /** Average of approved ratings, or 0 when a product has none. */
    @Query("select coalesce(avg(r.rating), 0) from ProductReview r "
            + "where r.product.id = :productId and r.approved = true")
    double averageRating(UUID productId);
}
