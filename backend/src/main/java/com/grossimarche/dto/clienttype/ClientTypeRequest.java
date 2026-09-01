package com.grossimarche.dto.clienttype;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Create or replace a client type.
 *
 * The slug is not accepted from the caller: it is derived from the name and kept stable across
 * renames, so letting a form set it would only be a way to break the references pointing at it.
 */
public record ClientTypeRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 500) String description,
        @PositiveOrZero Integer sortOrder,
        Boolean active
) {
}
