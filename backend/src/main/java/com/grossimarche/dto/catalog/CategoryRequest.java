package com.grossimarche.dto.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Admin: create or update a category.
 *
 * {@code nameAr} is optional: blank means "translate it for me on save", a value means "this
 * is the wording I want" and is kept. See CatalogueTranslator.
 */
public record CategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 100) String nameAr,
        @NotBlank @Size(max = 120) String slug,
        @Size(max = 60) String icon,
        @PositiveOrZero int displayOrder,
        boolean active
) {
}
