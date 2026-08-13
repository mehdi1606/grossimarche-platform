package com.grossimarche.dto.auth;

import com.grossimarche.dto.user.UserResponse;

/**
 * Issued after a successful OTP verification or refresh. The access token is a short-lived
 * RS256 JWT; the refresh token is an opaque, rotating secret.
 */
public record TokenResponse(
        String accessToken,
        long expiresIn,
        String refreshToken,
        UserResponse user
) {
}
