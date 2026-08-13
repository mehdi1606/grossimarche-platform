package com.grossimarche.exception;

/**
 * An OTP verification failed. Use {@link ErrorCode#OTP_INVALID} or
 * {@link ErrorCode#OTP_EXPIRED}. The message may state remaining attempts but must
 * never contain the code itself.
 */
public class InvalidOtpException extends BusinessException {

    public InvalidOtpException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }
}
