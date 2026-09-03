import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "@/utils/translation/fr.json";
import en from "@/utils/translation/en.json";

/**
 * The back-office speaks French.
 *
 * It used to open in whatever the browser asked for, through a language detector, against
 * bundles that existed only in English, German, Bengali and Hindi - so a French machine fell
 * back to English, and the labels the template never defined ("OurStaff", "ClientTypes")
 * rendered as their own key. Nothing in the interface switches language, so detection had
 * nothing to offer but that failure mode: the language is now simply French.
 *
 * English stays behind it as a second fallback. It is not a language anyone is offered - it is
 * insurance, so a key that slipped through the French bundle shows a word rather than
 * "AddCategoryDescription".
 */
i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: "fr",
  fallbackLng: ["fr", "en"],
  debug: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
