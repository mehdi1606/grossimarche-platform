import i18n from "i18next";
import Cookies from "js-cookie";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "@/utils/translation/en.json";
import de from "@/utils/translation/de.json";
import bn from "@/utils/translation/bn.json";
import hi from "@/utils/translation/hi.json";

/** The language to open in, if one was picked before. Only ever the *initial* choice. */
const initialLanguage = Cookies.get("i18next") || "en";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      bn: { translation: bn },
      hi: { translation: hi },
    },
    lng: initialLanguage,
    debug: false,
    /**
     * The fallback has to be a language that actually has a bundle here.
     *
     * It used to be this same cookie, which the detector fills with whatever the browser asks
     * for - "fr" on a French machine. There is no French bundle, so the fallback pointed at
     * nothing and every label rendered as its own key: that is why the sidebar read "OurStaff"
     * and "ClientTypes" instead of their labels. A fallback that can be missing is not a
     * fallback.
     */
    fallbackLng: "en",
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      //order: ['path', 'cookie', 'htmlTag'],
      caches: ["cookie"],
    },
  });
