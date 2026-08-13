package com.grossimarche.dto.common;

/** A single field-level validation error, embedded in {@link ApiError}. */
public record FieldError(String field, String message) {
}
