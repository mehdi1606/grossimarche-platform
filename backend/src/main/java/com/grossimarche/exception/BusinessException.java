package com.grossimarche.exception;

import com.grossimarche.dto.common.FieldError;

import java.util.List;

/**
 * Base class for all expected, client-facing errors. Carries an {@link ErrorCode}
 * (which supplies the HTTP status) and, optionally, field-level details. Programming
 * errors must not use this type - let them reach the 500 catch-all.
 *
 * <p>The message defaults to the code's French default; pass a custom message to
 * override it (e.g. to include an entity id or the number of remaining attempts -
 * never a secret).
 */
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;
    private final transient List<FieldError> fieldErrors;

    public BusinessException(ErrorCode errorCode) {
        this(errorCode, errorCode.getDefaultMessage(), List.of());
    }

    public BusinessException(ErrorCode errorCode, String message) {
        this(errorCode, message, List.of());
    }

    public BusinessException(ErrorCode errorCode, String message, List<FieldError> fieldErrors) {
        super(message);
        this.errorCode = errorCode;
        this.fieldErrors = fieldErrors == null ? List.of() : List.copyOf(fieldErrors);
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public List<FieldError> getFieldErrors() {
        return fieldErrors;
    }
}
