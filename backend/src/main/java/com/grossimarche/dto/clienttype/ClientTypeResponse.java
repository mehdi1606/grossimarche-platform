package com.grossimarche.dto.clienttype;

import com.grossimarche.entity.ClientType;

import java.util.UUID;

public record ClientTypeResponse(
        UUID id,
        String name,
        String slug,
        String description,
        int sortOrder,
        boolean active
) {

    public static ClientTypeResponse from(ClientType type) {
        return new ClientTypeResponse(type.getId(), type.getName(), type.getSlug(),
                type.getDescription(), type.getSortOrder(), type.isActive());
    }
}
