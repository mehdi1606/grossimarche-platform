package com.grossimarche.integration.storage;

import com.grossimarche.config.AppProperties;
import org.springframework.stereotype.Component;

/**
 * Translates a stored file reference between the form the database holds and the form a client
 * can open.
 *
 * Files are stored with a relative path ({@code /files/<key>}), which a browser resolves
 * against the page that asked for it. A mobile app has no such origin: handed
 * {@code /files/abc.jpg} it has nothing to resolve against, and every product photo comes back
 * empty. The absolute form is therefore built here, at the edge, and never written to the
 * database - so the day the shop moves from an IP address to a domain name, one environment
 * variable changes instead of every row in three tables.
 *
 * Both directions matter. The back-office reads an offer, keeps the picture it was shown, and
 * sends that same URL back when saving something else about it; without {@link #stored} that
 * round trip would quietly pin today's host into the record it just edited.
 */
@Component
public class PublicMedia {

    private final String origin;

    public PublicMedia(AppProperties properties) {
        this.origin = properties.api().publicUrl().replaceAll("/+$", "");
    }

    /**
     * The URL to hand a client.
     *
     * @param stored the value as the database holds it: relative, already absolute, or null
     * @return an absolute URL, or the value untouched when there is nothing to resolve
     */
    public String url(String stored) {
        if (isNothingToResolve(stored)) {
            return stored;
        }
        return stored.startsWith("/") ? origin + stored : origin + "/" + stored;
    }

    /**
     * The value to write back to the database.
     *
     * Strips this deployment's own origin so the record stays host-agnostic. A URL pointing
     * somewhere else entirely is left alone: it was never ours to rewrite.
     */
    public String stored(String incoming) {
        if (incoming == null || incoming.isBlank()) {
            return incoming;
        }
        String trimmed = incoming.trim();
        return trimmed.startsWith(origin) ? trimmed.substring(origin.length()) : trimmed;
    }

    private boolean isNothingToResolve(String value) {
        return value == null || value.isBlank()
                || value.startsWith("http://") || value.startsWith("https://")
                || value.startsWith("data:");
    }
}
