package com.grossimarche.dto.customer;

import com.grossimarche.entity.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

/** Admin: block or unblock a customer. */
public record CustomerStatusRequest(
        @NotNull UserStatus status
) {
}
