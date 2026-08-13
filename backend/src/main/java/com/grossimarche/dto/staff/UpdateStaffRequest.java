package com.grossimarche.dto.staff;

import com.grossimarche.entity.enums.Role;
import com.grossimarche.entity.enums.UserStatus;

/** Change a staff member's role and/or status. Null fields are left unchanged. */
public record UpdateStaffRequest(
        Role role,
        UserStatus status
) {
}
