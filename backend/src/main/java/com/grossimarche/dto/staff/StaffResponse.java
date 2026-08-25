package com.grossimarche.dto.staff;

import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * A back-office account (role ADMIN or STORE_MANAGER).
 *
 * The two credential fields are only ever populated by the create call:
 * <ul>
 *   <li>{@code invitationSent} - whether the generated password reached the new member's
 *       inbox. False means SMTP is not configured and the admin has to pass it on.</li>
 *   <li>{@code temporaryPassword} - returned <em>only</em> when the invitation could not be
 *       sent, so the account is not stranded. Null on every other response; the password is
 *       stored as a hash and can never be read back afterwards.</li>
 * </ul>
 */
public record StaffResponse(
        UUID id,
        String fullName,
        String phone,
        String email,
        Role role,
        UserStatus status,
        Instant createdAt,
        Instant lastLoginAt,
        Boolean invitationSent,
        String temporaryPassword
) {
}
