package com.grossimarche.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * Strongly-typed, validated application configuration bound from the {@code grossimarche.*}
 * namespace. Validation runs at startup, so a missing or malformed value fails fast
 * rather than surfacing as a confusing NPE later.
 *
 * @param api  public-facing API metadata
 * @param cors cross-origin allowlist (consumed by the security layer in B3)
 */
@ConfigurationProperties(prefix = "grossimarche")
@Validated
public record AppProperties(
        @Valid @NotNull Api api,
        @Valid @NotNull Cors cors
) {

    public record Api(@NotBlank String publicUrl) {
    }

    public record Cors(List<String> allowedOrigins) {
        public Cors {
            allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
        }
    }
}
