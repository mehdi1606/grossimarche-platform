package com.grossimarche.dto.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Admin: an informational product spec (e.g. name "Marque", value "Aïcha"). */
public record ProductAttributeRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Size(max = 255) String value,
        @PositiveOrZero int displayOrder
) {
}
