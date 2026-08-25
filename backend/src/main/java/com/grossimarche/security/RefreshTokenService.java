package com.grossimarche.security;

import com.grossimarche.config.JwtProperties;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

/**
 * Opaque, rotating refresh tokens stored server-side in Redis as SHA-256 hashes only.
 *
 * <p>Each token belongs to a <em>family</em> (one login/device). Rotation is single-use:
 * presenting the current token issues a new one; presenting an <em>already-rotated</em>
 * token is treated as theft and revokes the entire family. Redis layout per family:
 * <ul>
 *   <li>{@code rt:{hash}} → {@code userId:familyId} (membership + lookup)</li>
 *   <li>{@code rtcur:{userId}:{familyId}} → the current valid hash</li>
 *   <li>{@code rtfam:{userId}:{familyId}} → set of all hashes issued in the family</li>
 * </ul>
 * All keys carry the refresh TTL, so an idle family self-expires.
 */
@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final StringRedisTemplate redis;
    private final Duration ttl;

    public RefreshTokenService(StringRedisTemplate redis, JwtProperties props) {
        this.redis = redis;
        this.ttl = props.refreshTokenTtl();
    }

    /** Start a new token family for a fresh login. Returns the raw (unhashed) token. */
    public IssuedRefreshToken issue(UUID userId) {
        String familyId = UUID.randomUUID().toString();
        String token = newToken();
        store(userId, familyId, hash(token));
        return new IssuedRefreshToken(token, familyId);
    }

    /**
     * Rotate a presented token. Returns a new token bound to the same family.
     *
     * @throws BusinessException {@code TOKEN_INVALID} if unknown/expired, or on replay of an
     *                           already-rotated token (after revoking the whole family).
     */
    public RotatedRefreshToken rotate(String presentedToken) {
        String hash = hash(presentedToken);
        String record = redis.opsForValue().get(rtKey(hash));
        if (record == null) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID, "Jeton de rafraîchissement invalide.");
        }
        String[] parts = record.split(":", 2);
        UUID userId = UUID.fromString(parts[0]);
        String familyId = parts[1];

        String current = redis.opsForValue().get(curKey(userId, familyId));
        if (current == null || !current.equals(hash)) {
            // A superseded token was replayed → assume theft, burn the whole family.
            log.warn("Refresh token replay detected for family {} - revoking the family", familyId);
            revokeFamily(userId, familyId);
            throw new BusinessException(ErrorCode.TOKEN_INVALID,
                    "Jeton de rafraîchissement déjà utilisé. Session révoquée.");
        }

        String newToken = newToken();
        store(userId, familyId, hash(newToken));
        return new RotatedRefreshToken(newToken, userId, familyId);
    }

    /** Revoke the family the presented token belongs to (used at logout). Best-effort. */
    public void revoke(String presentedToken) {
        String record = redis.opsForValue().get(rtKey(hash(presentedToken)));
        if (record == null) {
            return;
        }
        String[] parts = record.split(":", 2);
        revokeFamily(UUID.fromString(parts[0]), parts[1]);
    }

    private void store(UUID userId, String familyId, String hash) {
        redis.opsForValue().set(rtKey(hash), userId + ":" + familyId, ttl);
        redis.opsForValue().set(curKey(userId, familyId), hash, ttl);
        redis.opsForSet().add(famKey(userId, familyId), hash);
        redis.expire(famKey(userId, familyId), ttl);
    }

    private void revokeFamily(UUID userId, String familyId) {
        Set<String> members = redis.opsForSet().members(famKey(userId, familyId));
        if (members != null) {
            members.forEach(h -> redis.delete(rtKey(h)));
        }
        redis.delete(curKey(userId, familyId));
        redis.delete(famKey(userId, familyId));
    }

    private static String newToken() {
        byte[] bytes = new byte[32]; // 256-bit
        RANDOM.nextBytes(bytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private static String rtKey(String hash) {
        return "rt:" + hash;
    }

    private static String curKey(UUID userId, String familyId) {
        return "rtcur:" + userId + ":" + familyId;
    }

    private static String famKey(UUID userId, String familyId) {
        return "rtfam:" + userId + ":" + familyId;
    }

    public record IssuedRefreshToken(String token, String familyId) {
    }

    public record RotatedRefreshToken(String token, UUID userId, String familyId) {
    }
}
