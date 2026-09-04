package com.grossimarche.dto.catalog;

import java.util.UUID;

/** A category with its active-product count. */
public record CategoryResponse(
        UUID id,
        String name,
        /** Arabic name, or null when nobody has translated this category yet. */
        String nameAr,
        String slug,
        String icon,
        int displayOrder,
        boolean active,
        long productCount
) {
}
