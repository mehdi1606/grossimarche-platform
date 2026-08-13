package com.grossimarche.dto.staff;

import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;

import java.time.Instant;
import java.util.UUID;

/** A back-office account (role ADMIN or STORE_MANAGER). */
public record StaffResponse(
        UUID id,
        String fullName,
        String phone,
        String email,
        Role role,
        UserStatus status,
        Instant createdAt,
        Instant lastLoginAt
) {
}
