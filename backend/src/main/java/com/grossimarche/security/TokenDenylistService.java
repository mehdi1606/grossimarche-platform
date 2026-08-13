package com.grossimarche.security;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/**
 * Access-token denylist in Redis. On logout a token's {@code jti} is stored until its
 * natural expiry, so the (otherwise still-valid) access token is rejected immediately.
 * Entries self-expire, so the denylist never grows unbounded.
 */
@Service
public class TokenDenylistService {

    private static final String PREFIX = "denylist:jti:";

    private final StringRedisTemplate redis;

    public TokenDenylistService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /** Denylist a jti until {@code expiresAt}. A no-op if the token has already expired. */
    public void denylist(String jti, Instant expiresAt) {
        Duration ttl = Duration.between(Instant.now(), expiresAt);
        if (ttl.isNegative() || ttl.isZero()) {
            return;
        }
        redis.opsForValue().set(PREFIX + jti, "1", ttl);
    }

    public boolean isDenylisted(String jti) {
        return Boolean.TRUE.equals(redis.hasKey(PREFIX + jti));
    }
}
