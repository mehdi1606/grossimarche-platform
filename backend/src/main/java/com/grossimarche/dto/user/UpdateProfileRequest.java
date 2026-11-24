package com.grossimarche.dto.user;

import jakarta.validation.constraints.Size;

/**
 * Update the current profile. Every field is optional: what is null is left as it is.
 *
 * The e-mail is NOT changed here: it is the sign-in identity, so a new address must first
 * prove it receives mail (POST /me/contact/request then /verify). The phone is a contact
 * number - unverified at sign-up too - and is changed directly, as long as no other account
 * uses it.
 */
public record UpdateProfileRequest(
        @Size(max = 150) String fullName,
        @Size(max = 150) String businessName,
        @Size(max = 20) String phone
) {
}
