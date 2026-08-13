package com.grossimarche.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * The single error shape returned by every endpoint (see the API contract).
 *
 * <pre>
 * {
 *   "timestamp": "2026-08-10T12:34:56Z",
 *   "status": 422,
 *   "code": "OTP_INVALID",
 *   "message": "Le code saisi est incorrect.",
 *   "fieldErrors": [{ "field": "code", "message": "Code à 6 chiffres requis" }],
 *   "traceId": "8f2c1a4e"
 * }
 * </pre>
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiError(
        Instant timestamp,
        int status,
        String code,
        String message,
        List<FieldError> fieldErrors,
        String traceId
) {

    public static ApiError of(int status, String code, String message, String traceId) {
        return new ApiError(Instant.now(), status, code, message, List.of(), traceId);
    }

    public static ApiError of(int status, String code, String message,
                              List<FieldError> fieldErrors, String traceId) {
        return new ApiError(Instant.now(), status, code, message,
                fieldErrors == null ? List.of() : fieldErrors, traceId);
    }
}
