package com.grossimarche.dto.user;

import com.grossimarche.entity.User;
import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;

import java.util.UUID;

/**
 * Public view of a user profile.
 *
 * Carries {@code status} and the client type because the storefront cannot render itself
 * without them: a PENDING customer gets the waiting screen rather than the shop, and the
 * segment is what the entire catalogue is priced against.
 *
 * {@code mustChangePassword} is only ever true for a back-office account still using the
 * password generated when it was created. Customers choose their own at sign-up, so there is
 * nothing for them to change.
 */
public record UserResponse(
        UUID id,
        String fullName,
        String businessName,
        String phone,
        String email,
        Role role,
        UserStatus status,
        UUID clientTypeId,
        String clientTypeName,
        boolean mustChangePassword
) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getBusinessName(),
                user.getPhone(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getClientType() == null ? null : user.getClientType().getId(),
                user.getClientType() == null ? null : user.getClientType().getName(),
                user.isMustChangePassword());
    }
}
