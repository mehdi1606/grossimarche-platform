package com.grossimarche.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Back-office sign-in. Staff accounts (ADMIN / STORE_MANAGER) use e-mail + password; the
 * storefront's customer accounts remain passwordless and use the OTP endpoints instead.
 */
public record PasswordLoginRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(max = 200) String password
) {
}
