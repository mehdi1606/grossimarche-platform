package com.grossimarche.dto.auth;

import jakarta.validation.constraints.NotBlank;

/** Revoke the given refresh token; the current access token's jti is also denylisted. */
public record LogoutRequest(
        @NotBlank String refreshToken
) {
}
