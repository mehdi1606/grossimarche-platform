package com.grossimarche.dto.attribute;

import com.grossimarche.entity.enums.AttributeType;

import java.util.List;
import java.util.UUID;

/** A catalogue attribute with its allowed values. */
public record AttributeResponse(
        UUID id,
        String name,
        AttributeType type,
        boolean enabled,
        List<AttributeValueResponse> values
) {
}
