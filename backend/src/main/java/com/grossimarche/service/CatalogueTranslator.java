package com.grossimarche.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Fills the catalogue's Arabic columns when a merchant saves, instead of at every page view.
 *
 * The storefront used to ask LibreTranslate for a product's name while drawing the page.
 * Measured here: 5-9 ms for a string already cached, but 2.1 s the first time one is seen and
 * 3.0 s for a batch of twelve - a cost paid by whichever customer happens to be the first to
 * open that product in Arabic. Doing it once on save moves the wait to the person who chose to
 * wait, and turns reading into a column read.
 *
 * Two rules, both deliberate:
 *
 * 1. **A human's text is never overwritten.** If the back-office already holds an Arabic name -
 *    typed, or corrected after the machine got it wrong - it stays. The machine only fills a
 *    blank. That is what makes the mistakes fixable: "Bidon de vinaigre blanc" came back as
 *    "زهرة الفينجار الأبيض", and before this there was nowhere to put the correction.
 *
 * 2. **A failed translation never fails the save.** LibreTranslate is a container that can be
 *    down, slow, or still loading its models. Refusing to save a product because its Arabic
 *    name could not be fetched would be absurd: the column stays null and the storefront falls
 *    back to translating at display time, exactly as it did before.
 */
@Service
public class CatalogueTranslator {

    private static final Logger log = LoggerFactory.getLogger(CatalogueTranslator.class);

    private static final String SOURCE = "fr";
    private static final String TARGET = "ar";

    private final TranslationService translationService;

    public CatalogueTranslator(TranslationService translationService) {
        this.translationService = translationService;
    }

    /**
     * The Arabic to store for one field.
     *
     * @param french  the source text as the merchant wrote it
     * @param current what the record already holds in Arabic, if anything
     * @return {@code current} when it is set, otherwise the machine's attempt, otherwise null
     */
    public String arabicFor(String french, String current) {
        if (current != null && !current.isBlank()) {
            return current.trim();
        }
        if (french == null || french.isBlank()) {
            return null;
        }
        try {
            String out = translationService.translate(french.trim(), SOURCE, TARGET);
            // The service refuses to return output in the wrong script, and answers with the
            // input when it cannot do better. Storing that would freeze French into the Arabic
            // column, where nothing would ever look at it again.
            return out == null || out.isBlank() || out.equals(french.trim()) ? null : out;
        } catch (RuntimeException e) {
            log.warn("Arabic translation unavailable, leaving the field empty: {}", e.getMessage());
            return null;
        }
    }

    /** Same rule, for a record's two fields at once - one round trip instead of two. */
    public String[] arabicFor(String frenchName, String currentName,
                              String frenchDescription, String currentDescription) {
        boolean needName = (currentName == null || currentName.isBlank())
                && frenchName != null && !frenchName.isBlank();
        boolean needDescription = (currentDescription == null || currentDescription.isBlank())
                && frenchDescription != null && !frenchDescription.isBlank();

        if (!needName && !needDescription) {
            return new String[]{trimToNull(currentName), trimToNull(currentDescription)};
        }
        if (needName != needDescription) {
            // Only one is missing: a batch of one buys nothing over the single-field path.
            return new String[]{
                    needName ? arabicFor(frenchName, null) : trimToNull(currentName),
                    needDescription ? arabicFor(frenchDescription, null) : trimToNull(currentDescription),
            };
        }
        try {
            List<String> out = translationService.translateBatch(
                    List.of(frenchName.trim(), frenchDescription.trim()), SOURCE, TARGET);
            return new String[]{clean(out, 0, frenchName), clean(out, 1, frenchDescription)};
        } catch (RuntimeException e) {
            log.warn("Arabic translation unavailable, leaving the fields empty: {}", e.getMessage());
            return new String[]{null, null};
        }
    }

    private String clean(List<String> out, int index, String source) {
        if (out == null || out.size() <= index) return null;
        String value = out.get(index);
        return value == null || value.isBlank() || value.equals(source.trim()) ? null : value;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
