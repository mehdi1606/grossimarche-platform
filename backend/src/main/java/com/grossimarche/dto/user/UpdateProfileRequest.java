package com.grossimarche.dto.user;

import jakarta.validation.constraints.Size;

/**
 * Update the current profile. Changing phone or email is NOT done here - it requires a
 * fresh OTP verification of the new destination (B8). Only free-form profile fields here.
 */
public record UpdateProfileRequest(
        @Size(max = 150) String fullName
) {
}
