package com.grossimarche.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Change one's own back-office password. The current password is required even though the
 * caller is authenticated - an unattended open session should not be enough to lock the real
 * owner out of their account.
 */
public record ChangePasswordRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 10, max = 200) String newPassword
) {
}
