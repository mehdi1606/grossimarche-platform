package com.grossimarche.dto.language;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Admin: create or update a language. */
public record LanguageRequest(
        @NotBlank @Size(max = 60) String name,
        @NotBlank @Size(max = 10) String isoCode,
        @Size(max = 255) String flag,
        boolean isDefault,
        boolean enabled
) {
}
