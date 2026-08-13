package com.grossimarche.service;

import com.grossimarche.dto.mapper.ReviewMapper;
import com.grossimarche.dto.review.AdminReviewResponse;
import com.grossimarche.dto.review.ReviewRequest;
import com.grossimarche.dto.review.ReviewResponse;
import com.grossimarche.entity.Product;
import com.grossimarche.entity.ProductReview;
import com.grossimarche.exception.ResourceNotFoundException;
import com.grossimarche.repository.ProductReviewRepository;
import com.grossimarche.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Product reviews: public listing of approved reviews, authenticated submission (moderated
 * — a new or edited review starts unapproved), and admin moderation. One review per
 * (product, user): a repeat submission updates the existing row and re-enters moderation.
 */
@Service
public class ReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductService productService;
    private final ReviewMapper reviewMapper;
    private final UserRepository userRepository;

    public ReviewService(ProductReviewRepository reviewRepository, ProductService productService,
                         ReviewMapper reviewMapper, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.productService = productService;
        this.reviewMapper = reviewMapper;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviews(UUID productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(productId, pageable)
                .map(reviewMapper::toResponse);
    }

    @Transactional
    public ReviewResponse submit(UUID userId, UUID productId, ReviewRequest req) {
        Product product = productService.getById(productId);
        ProductReview review = reviewRepository.findByProductIdAndUserId(productId, userId)
                .orElseGet(() -> ProductReview.builder()
                        .product(product)
                        .user(userRepository.getReferenceById(userId))
                        .build());
        review.setRating(req.rating());
        review.setComment(req.comment());
        review.setApproved(false); // (re)moderation required before it shows publicly
        return reviewMapper.toResponse(reviewRepository.save(review));
    }

    // ---- Admin moderation -------------------------------------------------------------

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional(readOnly = true)
    public Page<AdminReviewResponse> list(Pageable pageable) {
        return reviewRepository.findAll(pageable).map(reviewMapper::toAdmin);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public AdminReviewResponse approve(UUID id) {
        ProductReview review = getById(id);
        review.setApproved(true);
        return reviewMapper.toAdmin(review);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STORE_MANAGER')")
    @Transactional
    public void delete(UUID id) {
        reviewRepository.delete(getById(id));
    }

    private ProductReview getById(UUID id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Avis", id));
    }
}
