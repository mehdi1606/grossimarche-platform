package com.grossimarche.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

/** URL-safe identifiers derived from human names. */
public final class Slugs {

    private Slugs() {
    }

    /**
     * "Patisserie & snacking" -> "patisserie-snacking".
     *
     * Accents are folded rather than dropped, so "Epicerie" and "epicerie" reduce to the same
     * slug instead of one of them losing its first letter.
     *
     * @param fallback used when the name contains nothing sluggable at all (say, only Arabic
     *                 script or punctuation) - an empty slug would break the unique index.
     */
    public static String slugify(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.isBlank() ? fallback : normalized;
    }

    /**
     * A slug that nothing else is using, suffixing -2, -3, … until it is free.
     *
     * @param taken answers "is this slug already used by someone other than the row being
     *              saved?" - the caller owns that distinction, so renaming a row to its own
     *              slug does not collide with itself.
     */
    public static String unique(String value, String fallback, Predicate<String> taken) {
        String base = slugify(value, fallback);
        String candidate = base;
        int suffix = 2;
        while (taken.test(candidate)) {
            candidate = base + "-" + suffix++;
            if (suffix > 100) {
                // 99 collisions on one name is not a naming accident; refusing beats looping.
                throw new IllegalStateException("Impossible de générer un identifiant unique.");
            }
        }
        return candidate;
    }
}
