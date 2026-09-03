import { useEffect } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { I18nextProvider } from "react-i18next";

//internal import
import i18n, { SOURCE_LOCALE, SUPPORTED_LOCALES, isRtl } from "@lib/i18n";

/**
 * Puts the shop's own words into the visitor's language.
 *
 * Reads the locale from the same `_lang` cookie the rest of the storefront already uses, so
 * there is one language setting and not two that can disagree.
 *
 * The switch happens during render, not in an effect. An effect here runs *after* the children's
 * effects, so a page that fetched on mount and reported a failure got its message in French
 * while the rest of the page was already Arabic - the language changed a beat too late.
 *
 * Rendering is the right moment because the locale is in the URL, which the server knows too:
 * both sides render the same language, so there is no hydration mismatch to avoid. The call is
 * synchronous - every catalogue is bundled, nothing is fetched - and idempotent.
 *
 * The effect keeps only what belongs to the document: `lang`, and `dir`, which is what actually
 * makes Arabic readable. A perfect translation laid out left-to-right is still the wrong shop.
 */
const I18nProvider = ({ children }) => {
  const router = useRouter();
  const locale = router?.locale || Cookies.get("_lang") || SOURCE_LOCALE;
  const active = SUPPORTED_LOCALES.includes(locale) ? locale : SOURCE_LOCALE;

  if (i18n.language !== active) {
    i18n.changeLanguage(active);
  }

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = active;
      document.documentElement.dir = isRtl(active) ? "rtl" : "ltr";
    }
  }, [active]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default I18nProvider;
