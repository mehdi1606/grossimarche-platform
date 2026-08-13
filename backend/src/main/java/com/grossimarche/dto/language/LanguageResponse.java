package com.grossimarche.dto.language;

import java.util.UUID;

/** A language as returned by the API. */
public record LanguageResponse(
        UUID id,
        String name,
        String isoCode,
        String flag,
        boolean isDefault,
        boolean enabled
) {
}
