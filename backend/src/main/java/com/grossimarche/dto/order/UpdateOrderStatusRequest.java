package com.grossimarche.dto.order;

import com.grossimarche.entity.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Admin: advance an order to a new status (validated against the state machine in B6). */
public record UpdateOrderStatusRequest(
        @NotNull OrderStatus status,
        @Size(max = 255) String note
) {
}
