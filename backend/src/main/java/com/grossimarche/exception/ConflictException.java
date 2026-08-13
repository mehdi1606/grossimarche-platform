package com.grossimarche.exception;

/**
 * The request conflicts with current server state. Defaults to {@code DUPLICATE_REQUEST}
 * but accepts any conflict-family code (e.g. {@code PRICE_CHANGED}).
 */
public class ConflictException extends BusinessException {

    public ConflictException(String message) {
        super(ErrorCode.DUPLICATE_REQUEST, message);
    }

    public ConflictException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }
}
