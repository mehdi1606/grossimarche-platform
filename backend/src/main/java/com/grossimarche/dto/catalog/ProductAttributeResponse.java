package com.grossimarche.dto.catalog;

import java.util.UUID;

/** A product's informational spec, shown on the product detail page. */
public record ProductAttributeResponse(
        UUID id,
        String name,
        String value,
        int displayOrder
) {
}
