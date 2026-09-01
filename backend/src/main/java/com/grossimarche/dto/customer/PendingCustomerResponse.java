package com.grossimarche.dto.customer;

import com.grossimarche.entity.User;

import java.time.Instant;
import java.util.UUID;

/**
 * A shop waiting to be recognised.
 *
 * Everything an admin needs to make the call in one row: the trading name and the segment
 * matter more than the contact's name, because the decision is about the business.
 */
public record PendingCustomerResponse(
        UUID id,
        String fullName,
        String businessName,
        String email,
        String phone,
        String city,
        UUID clientTypeId,
        String clientTypeName,
        Instant createdAt
) {

    public static PendingCustomerResponse from(User user) {
        return new PendingCustomerResponse(
                user.getId(),
                user.getFullName(),
                user.getBusinessName(),
                user.getEmail(),
                user.getPhone(),
                user.getCity(),
                user.getClientType() == null ? null : user.getClientType().getId(),
                user.getClientType() == null ? null : user.getClientType().getName(),
                user.getCreatedAt());
    }
}
