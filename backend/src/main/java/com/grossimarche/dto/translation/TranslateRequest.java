package com.grossimarche.dto.translation;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/** A batch translation request. {@code source} defaults to French when omitted. */
public record TranslateRequest(
        @NotEmpty List<String> q,
        String source,
        String target
) {
}
