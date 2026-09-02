package com.grossimarche.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * The three steps of a forgotten password, kept together because they are one conversation and
 * reading them apart hides that the e-mail has to be repeated at every step.
 *
 * It is repeated because the code is stored against the address, not against a session: the
 * shopper may finish on a different device from the one that asked, which is exactly what
 * happens when someone checks their mail on a phone.
 */
public final class PasswordResetRequests {

    private PasswordResetRequests() {
    }

    /** Step 1: ask for a code. */
    public record Forgot(@NotBlank @Email @Size(max = 255) String email) {
    }

    /** Step 2: check the code before asking for a new password. */
    public record VerifyCode(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 4, max = 10) String code
    ) {
    }

    /** Step 3: spend the code and set the password. */
    public record Reset(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 4, max = 10) String code,
            @NotBlank @Size(max = 100) String newPassword
    ) {
    }
}
