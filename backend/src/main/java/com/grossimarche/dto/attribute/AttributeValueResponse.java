package com.grossimarche.dto.attribute;

import java.util.UUID;

/** One allowed value of an attribute. */
public record AttributeValueResponse(
        UUID id,
        String name,
        boolean enabled,
        int displayOrder
) {
}
