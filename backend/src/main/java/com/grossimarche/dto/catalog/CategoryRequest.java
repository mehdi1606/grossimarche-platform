package com.grossimarche.dto.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Admin: create or update a category. */
public record CategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 120) String slug,
        @Size(max = 60) String icon,
        @PositiveOrZero int displayOrder,
        boolean active
) {
}
