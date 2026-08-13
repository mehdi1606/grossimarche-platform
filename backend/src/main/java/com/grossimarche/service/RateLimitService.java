package com.grossimarche.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Simple distributed fixed-window rate limiter backed by Redis ({@code INCR} + {@code
 * EXPIRE}). Chosen over a heavier Bucket4j/Lettuce proxy-manager setup for predictability
 * on this stack; it is sufficient for OTP abuse prevention and returns an accurate
 * {@code Retry-After}. Swap for a token-bucket later if smoother shaping is needed.
 */
@Service
public class RateLimitService {

    private final StringRedisTemplate redis;

    public RateLimitService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /**
     * Count one hit against {@code key} within a fixed {@code window} of size {@code limit}.
     *
     * @return the outcome, including seconds to wait when the limit is exceeded
     */
    public Result hit(String key, int limit, Duration window) {
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redis.expire(key, window);
        }
        if (count != null && count > limit) {
            Long ttl = redis.getExpire(key);
            long retryAfter = (ttl == null || ttl < 0) ? window.toSeconds() : ttl;
            return new Result(false, retryAfter);
        }
        return new Result(true, 0);
    }

    public record Result(boolean allowed, long retryAfterSeconds) {
    }
}
