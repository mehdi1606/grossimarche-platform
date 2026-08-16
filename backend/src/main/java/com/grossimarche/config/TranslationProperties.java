package com.grossimarche.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Self-hosted LibreTranslate settings. Machine translation is best-effort: when it is
 * disabled or unreachable the source text is returned unchanged, so the store never breaks.
 *
 * @param enabled  master switch
 * @param url      base URL of the LibreTranslate service (e.g. http://libretranslate:5000)
 * @param apiKey   optional API key (blank when the instance is open)
 * @param timeoutMs per-request timeout in milliseconds
 */
@ConfigurationProperties(prefix = "grossimarche.translation")
public record TranslationProperties(
        @DefaultValue("true") boolean enabled,
        @DefaultValue("http://libretranslate:5000") String url,
        @DefaultValue("") String apiKey,
        // Read timeout: LibreTranslate pivots fr->en->ar, so a batch can take many seconds.
        @DefaultValue("30000") long timeoutMs
) {
}
