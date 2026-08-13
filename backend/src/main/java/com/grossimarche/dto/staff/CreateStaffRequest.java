package com.grossimarche.dto.staff;

import com.grossimarche.entity.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Invite a staff member. There are no passwords — the account signs in by OTP on the phone
 * or email given here, so at least one of the two is required (validated in the service).
 */
public record CreateStaffRequest(
        @Size(max = 150) String fullName,
        @Size(max = 20) String phone,
        @Email @Size(max = 255) String email,
        @NotNull Role role
) {
}
