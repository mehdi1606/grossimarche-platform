import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";

//internal import
import TranslationServices from "@services/TranslationServices";

/**
 * Storefront translation engine (FR -> AR).
 *
 * The database stores content in French only, so dynamic values ({ en/fr } objects or plain
 * strings) and static UI strings are translated on the fly through the backend's LibreTranslate
 * endpoint. Results are cached per session in React state (and forever in the backend's Redis),
 * so each unique string is fetched once. While a translation is in flight the French text is
 * shown, then swapped to Arabic when the batch resolves. It also flips <html dir> for RTL.
 */
const TranslationContext = createContext(null);

const pickBase = (obj, locale) => {
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] ?? obj.fr ?? obj.en ?? Object.values(obj)[0] ?? "";
};

export const TranslationProvider = ({ children }) => {
  const router = useRouter();
  const locale = router?.locale || Cookies.get("_lang") || "fr";

  const [cache, setCache] = useState({}); // frenchText -> arabicText
  const pending = useRef(new Set());
  const queue = useRef([]);
  const timer = useRef(null);

  // RTL: flip the document direction and language for Arabic.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  const flush = useCallback(async () => {
    const batch = [...new Set(queue.current)].filter(Boolean);
    queue.current = [];
    if (!batch.length) return;
    try {
      const res = await TranslationServices.translate({
        q: batch,
        source: "fr",
        target: "ar",
      });
      const out = res?.translatedText || [];
      setCache((prev) => {
        const next = { ...prev };
        batch.forEach((t, i) => {
          next[t] = out[i] ?? t;
        });
        return next;
      });
    } catch (e) {
      // best-effort — leave the French text in place
    } finally {
      batch.forEach((t) => pending.current.delete(t));
    }
  }, []);

  const enqueue = useCallback(
    (text) => {
      if (!text || pending.current.has(text)) return;
      pending.current.add(text);
      queue.current.push(text);
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 200); // coalesce a render's worth of strings
    },
    [flush]
  );

  // Dynamic values: a multilingual object ({ en/fr/ar }) or a plain string.
  const translateValue = useCallback(
    (obj) => {
      const base = pickBase(obj, locale);
      if (locale !== "ar" || !base) return base;
      if (typeof obj === "object" && obj?.ar) return obj.ar;
      if (cache[base] !== undefined) return cache[base];
      enqueue(base);
      return base;
    },
    [locale, cache, enqueue]
  );

  // Static French UI strings.
  const t = useCallback(
    (text) => {
      if (locale !== "ar" || !text) return text;
      if (cache[text] !== undefined) return cache[text];
      enqueue(text);
      return text;
    },
    [locale, cache, enqueue]
  );

  return (
    <TranslationContext.Provider
      value={{ locale, translateValue, t, isRTL: locale === "ar" }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

// Safe default so components work even if rendered outside the provider (SSR edge cases).
export const useTranslate = () => {
  const ctx = useContext(TranslationContext);
  return (
    ctx || {
      locale: "fr",
      translateValue: (o) => pickBase(o, "fr"),
      t: (x) => x,
      isRTL: false,
    }
  );
};

export default TranslationContext;
