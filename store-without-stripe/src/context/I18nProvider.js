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
 * The switch happens in an effect rather than during init, on purpose: the server renders in
 * French, so a client that started in Arabic would produce different HTML on the first pass and
 * React would discard the whole tree. Switching after mount costs one extra render and keeps
 * hydration intact.
 *
 * It also sets `lang` and `dir` on the document. `dir` is what actually makes Arabic readable -
 * a perfect translation laid out left-to-right is still the wrong shop.
 */
const I18nProvider = ({ children }) => {
  const router = useRouter();
  const locale = router?.locale || Cookies.get("_lang") || SOURCE_LOCALE;
  const active = SUPPORTED_LOCALES.includes(locale) ? locale : SOURCE_LOCALE;

  useEffect(() => {
    if (i18n.language !== active) {
      i18n.changeLanguage(active);
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = active;
      document.documentElement.dir = isRtl(active) ? "rtl" : "ltr";
    }
  }, [active]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default I18nProvider;
