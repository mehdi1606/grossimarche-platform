package com.grossimarche.service;

import com.grossimarche.config.OtpProperties;
import com.grossimarche.dto.auth.OtpRequestResponse;
import com.grossimarche.entity.enums.OtpChannel;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import com.grossimarche.exception.InvalidOtpException;
import com.grossimarche.exception.RateLimitExceededException;
import com.grossimarche.integration.OtpSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * One-time-code request and verification. The code is generated with {@link SecureRandom},
 * BCrypt-hashed, and only the <em>hash</em> is stored in Redis (single use, 5-minute TTL,
 * attempt-counted). The plaintext code is returned to no caller and logged nowhere above
 * DEBUG. Requests are rate-limited per destination and per IP.
 */
@Service
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Pattern MOROCCAN_NATIONAL = Pattern.compile("^[67]\\d{8}$");
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final StringRedisTemplate redis;
    private final PasswordEncoder passwordEncoder;
    private final OtpProperties props;
    private final RateLimitService rateLimiter;
    private final Map<OtpChannel, OtpSender> senders;

    public OtpService(StringRedisTemplate redis, PasswordEncoder passwordEncoder,
                      OtpProperties props, RateLimitService rateLimiter, List<OtpSender> senderBeans) {
        this.redis = redis;
        this.passwordEncoder = passwordEncoder;
        this.props = props;
        this.rateLimiter = rateLimiter;
        this.senders = new EnumMap<>(OtpChannel.class);
        senderBeans.forEach(s -> this.senders.put(s.channel(), s));
    }

    /** Generate, store and dispatch a code. Never returns the code. */
    public OtpRequestResponse request(OtpChannel channel, String rawDestination, String ip) {
        String destination = normalize(channel, rawDestination);

        enforceRateLimit(rlDestKey(channel, destination),
                props.maxRequestsPerDestination(), props.destinationWindow());
        enforceRateLimit(rlIpKey(ip), props.maxRequestsPerIp(), props.ipWindow());

        String code = generateCode();
        redis.opsForValue().set(hashKey(channel, destination), passwordEncoder.encode(code), props.ttl());
        redis.opsForValue().set(attemptsKey(channel, destination), "0", props.ttl());

        senderFor(channel).send(destination, code);

        return new OtpRequestResponse(channel, mask(channel, destination), (int) props.ttl().toSeconds());
    }

    /**
     * Verify a code. On success the stored code is deleted immediately (single use) and the
     * normalized destination is returned.
     *
     * @throws InvalidOtpException        on expiry or a wrong code (with remaining attempts)
     * @throws RateLimitExceededException when the destination is temporarily blocked
     */
    public VerifiedOtp verify(OtpChannel channel, String rawDestination, String code) {
        String destination = normalize(channel, rawDestination);

        if (Boolean.TRUE.equals(redis.hasKey(blockKey(channel, destination)))) {
            Long ttl = redis.getExpire(blockKey(channel, destination));
            throw new RateLimitExceededException(ttl == null || ttl < 0 ? props.blockDuration().toSeconds() : ttl,
                    "Trop de tentatives. Destination temporairement bloquée.");
        }

        String hash = redis.opsForValue().get(hashKey(channel, destination));
        if (hash == null) {
            throw new InvalidOtpException(ErrorCode.OTP_EXPIRED,
                    "Code expiré ou introuvable. Veuillez demander un nouveau code.");
        }

        if (passwordEncoder.matches(code, hash)) {
            redis.delete(hashKey(channel, destination));
            redis.delete(attemptsKey(channel, destination));
            return new VerifiedOtp(channel, destination);
        }

        Long attempts = redis.opsForValue().increment(attemptsKey(channel, destination));
        long used = attempts == null ? 1 : attempts;
        if (used >= props.maxVerifyAttempts()) {
            redis.delete(hashKey(channel, destination));
            redis.delete(attemptsKey(channel, destination));
            redis.opsForValue().set(blockKey(channel, destination), "1", props.blockDuration());
            throw new InvalidOtpException(ErrorCode.OTP_INVALID,
                    "Code incorrect. Trop de tentatives, veuillez réessayer plus tard.");
        }
        long remaining = props.maxVerifyAttempts() - used;
        throw new InvalidOtpException(ErrorCode.OTP_INVALID,
                "Code incorrect. Il vous reste " + remaining + " tentative(s).");
    }

    /** Mask a destination for display, e.g. {@code +2126••••••78} or {@code a••@b.ma}. */
    public String mask(OtpChannel channel, String destination) {
        if (channel == OtpChannel.SMS) {
            // +212 + 9 national digits
            String prefix = destination.substring(0, 5);
            String last2 = destination.substring(destination.length() - 2);
            return prefix + "••••••" + last2;
        }
        int at = destination.indexOf('@');
        String local = destination.substring(0, at);
        String maskedLocal = local.isEmpty() ? "" : local.charAt(0) + "••";
        return maskedLocal + destination.substring(at);
    }

    private void enforceRateLimit(String key, int limit, Duration window) {
        RateLimitService.Result result = rateLimiter.hit(key, limit, window);
        if (!result.allowed()) {
            throw new RateLimitExceededException(result.retryAfterSeconds(),
                    "Trop de demandes. Veuillez réessayer plus tard.");
        }
    }

    private OtpSender senderFor(OtpChannel channel) {
        OtpSender sender = senders.get(channel);
        if (sender == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "Aucun canal d'envoi configuré pour " + channel);
        }
        return sender;
    }

    private String normalize(OtpChannel channel, String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Destination requise.");
        }
        return channel == OtpChannel.SMS ? normalizePhone(raw) : normalizeEmail(raw);
    }

    private String normalizePhone(String raw) {
        String digits = raw.replaceAll("\\D", "");
        String national;
        if (digits.startsWith("212")) {
            national = digits.substring(3);
        } else if (digits.startsWith("0")) {
            national = digits.substring(1);
        } else {
            national = digits;
        }
        if (!MOROCCAN_NATIONAL.matcher(national).matches()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Numéro de téléphone marocain invalide (format attendu : 06XXXXXXXX ou 07XXXXXXXX).");
        }
        return "+212" + national;
    }

    private String normalizeEmail(String raw) {
        String email = raw.trim().toLowerCase();
        if (!EMAIL.matcher(email).matches()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Adresse e-mail invalide.");
        }
        return email;
    }

    private String generateCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private String hashKey(OtpChannel channel, String destination) {
        return "otp:hash:" + channel + ":" + destination;
    }

    private String attemptsKey(OtpChannel channel, String destination) {
        return "otp:att:" + channel + ":" + destination;
    }

    private String blockKey(OtpChannel channel, String destination) {
        return "otp:block:" + channel + ":" + destination;
    }

    private String rlDestKey(OtpChannel channel, String destination) {
        return "otp:rl:dest:" + channel + ":" + destination;
    }

    private String rlIpKey(String ip) {
        return "otp:rl:ip:" + ip;
    }

    /** A successfully verified OTP: the channel and the normalized destination. */
    public record VerifiedOtp(OtpChannel channel, String destination) {
    }
}
