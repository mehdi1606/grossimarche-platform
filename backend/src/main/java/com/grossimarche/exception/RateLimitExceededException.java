package com.grossimarche.exception;

/**
 * Too many requests. Carries the seconds the caller must wait so the handler can emit a
 * {@code Retry-After} header. Always uses {@link ErrorCode#OTP_RATE_LIMITED} (429).
 */
public class RateLimitExceededException extends BusinessException {

    private final long retryAfterSeconds;

    public RateLimitExceededException(long retryAfterSeconds, String message) {
        super(ErrorCode.OTP_RATE_LIMITED, message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
