package com.grossimarche.repository;

import com.grossimarche.dto.review.ProductRating;
import com.grossimarche.entity.ProductReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
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

    /**
     * Ratings for a set of products in one query - what an offer announcement needs, where the
     * per-product calls above would mean two round trips for every line of the basket.
     *
     * Products with no approved review are simply absent from the result rather than returned
     * as zero: "no opinion yet" and "rated zero" must not look the same to the caller.
     */
    @Query("""
            select new com.grossimarche.dto.review.ProductRating(
                    r.product.id, avg(r.rating), count(r))
            from ProductReview r
            where r.product.id in :productIds and r.approved = true
            group by r.product.id
            """)
    List<ProductRating> ratingsFor(Collection<UUID> productIds);
}
