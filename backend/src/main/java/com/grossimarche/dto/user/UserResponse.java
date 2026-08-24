package com.grossimarche.dto.user;

import com.grossimarche.entity.enums.Role;

import java.util.UUID;

/**
 * Public view of a user profile.
 *
 * {@code mustChangePassword} is only ever true for a back-office account still using the
 * password that was generated when it was created; it is always false for customers, who have
 * no password at all.
 */
public record UserResponse(
        UUID id,
        String fullName,
        String phone,
        String email,
        Role role,
        boolean mustChangePassword
) {
}
