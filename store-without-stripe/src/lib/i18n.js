import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import fr from "@locales/fr.json";
import ar from "@locales/ar.json";
// Sign-in, sign-up and password reset carry enough text to be worth their own file. Merged
// under an "auth" namespace rather than loaded as a separate i18next namespace: one namespace
// means every t() call in the app reads the same way.
import authFr from "@locales/auth.fr.json";
import authAr from "@locales/auth.ar.json";

/**
 * The shop's own words, in French and Arabic.
 *
 * These are written by hand, not machine-translated at display time. Interface text is a
 * closed set read by every visitor on every page: it has to be instant, and it has to be
 * right - a mistranslated "Passer la commande" costs an order, and a machine that gets it
 * wrong gets it wrong again on every single view, with no way to correct it.
 *
 * Catalogue text - product names, descriptions - is the opposite problem and is handled
 * elsewhere: translated once when the merchant saves it, stored, and correctable.
 *
 * French is the source. An Arabic key that is missing falls back to the French rather than
 * showing a blank or a raw key: a shop with holes in it is worse than a shop in French.
 *
 * The Arabic is Modern Standard Arabic, not Moroccan dialect. Keep that register when adding
 * keys: it reads correctly to every Arabic speaker, it is what a professional shop is expected
 * to sound like in writing, and it does not force a reader to parse spoken forms.
 */
export const SOURCE_LOCALE = "fr";
export const SUPPORTED_LOCALES = ["fr", "ar"];

/** Locales written right-to-left. Layout, not translation - see the `dir` attribute. */
export const RTL_LOCALES = ["ar"];

export const isRtl = (locale) => RTL_LOCALES.includes(locale);

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: { ...fr, auth: authFr } },
    ar: { translation: { ...ar, auth: authAr } },
  },
  // Initialised on the source language and switched by the provider once the visitor's choice
  // is known. Server and first client render therefore agree, which is what avoids the
  // hydration mismatch a cookie read during init would cause.
  lng: SOURCE_LOCALE,
  fallbackLng: SOURCE_LOCALE,
  supportedLngs: SUPPORTED_LOCALES,
  interpolation: {
    // React escapes for us; escaping twice turns an apostrophe into &#39; on screen.
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
