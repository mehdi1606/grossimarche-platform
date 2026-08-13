package com.grossimarche.dto.catalog;

import java.util.UUID;

/** A category with its active-product count. */
public record CategoryResponse(
        UUID id,
        String name,
        String slug,
        String icon,
        int displayOrder,
        boolean active,
        long productCount
) {
}
