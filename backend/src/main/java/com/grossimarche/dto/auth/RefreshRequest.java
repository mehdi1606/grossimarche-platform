package com.grossimarche.dto.auth;

import jakarta.validation.constraints.NotBlank;

/** Exchange a valid refresh token for a new token pair (rotation). */
public record RefreshRequest(
        @NotBlank String refreshToken
) {
}
