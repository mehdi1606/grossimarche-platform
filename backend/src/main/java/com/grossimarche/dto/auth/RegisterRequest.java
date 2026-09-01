package com.grossimarche.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * A shop applying for a trade account.
 *
 * The client type is required and cannot be changed by the applicant afterwards: it selects the
 * price list, so letting someone re-pick it would be letting them re-price themselves. An admin
 * can correct it at validation.
 */
public record RegisterRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Size(max = 150) String businessName,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(max = 20) String phone,
        @Size(max = 100) String city,
        @NotNull UUID clientTypeId,
        /** Checked against the same strength rule as staff passwords. */
        @NotBlank @Size(max = 100) String password
) {
}
