package com.grossimarche.dto.user;

import com.grossimarche.entity.enums.Role;

import java.util.UUID;

/** Public view of a user profile. */
public record UserResponse(
        UUID id,
        String fullName,
        String phone,
        String email,
        Role role
) {
}
