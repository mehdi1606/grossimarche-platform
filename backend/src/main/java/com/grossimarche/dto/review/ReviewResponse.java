package com.grossimarche.dto.review;

import java.time.Instant;
import java.util.UUID;

/** A public (approved) product review. */
public record ReviewResponse(
        UUID id,
        int rating,
        String comment,
        String authorName,
        Instant createdAt
) {
}
