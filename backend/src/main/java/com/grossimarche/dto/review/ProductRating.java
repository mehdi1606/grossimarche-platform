package com.grossimarche.dto.review;

import java.util.UUID;

/**
 * What approved reviews say about one product, in summary.
 *
 * Exists so a screen showing several products at once - an offer announcement listing a whole
 * basket - can read every rating in a single query instead of two per product.
 *
 * @param average of approved ratings only; a review waiting for moderation counts for nothing
 * @param count   how many approved reviews the average rests on, shown beside it because a
 *                4,8 out of three opinions is not a 4,8 out of two hundred
 */
public record ProductRating(UUID productId, double average, long count) {
}
