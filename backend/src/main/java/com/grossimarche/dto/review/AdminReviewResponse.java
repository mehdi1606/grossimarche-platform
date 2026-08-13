package com.grossimarche.dto.review;

import java.time.Instant;
import java.util.UUID;

/** Admin view of a review for moderation. */
public record AdminReviewResponse(
        UUID id,
        UUID productId,
        String productName,
        UUID userId,
        String authorName,
        int rating,
        String comment,
        boolean approved,
        Instant createdAt
) {
}
