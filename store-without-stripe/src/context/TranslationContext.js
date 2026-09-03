import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";

//internal import
import TranslationServices from "@services/TranslationServices";

/**
 * Storefront translation engine - machine translation instead of locale files.
 *
 * Everything the visitor reads is authored once, in French, in the code and in the database.
 * There are no `locales/*.json` catalogues to keep in sync: dynamic values *and* static UI
 * strings are translated on demand through the backend's LibreTranslate endpoint, which caches
 * every result in Redis. That is why adding a language is a configuration change here rather
 * than a translation project - and why a string that is never shown is never paid for.
 *
 * Three layers of cache keep it cheap:
 *   1. an in-memory map, so a string is looked up once per session;
 *   2. `localStorage`, so a returning visitor starts already translated;
 *   3. Redis on the backend, shared by every visitor.
 *
 * While a translation is in flight the French text stays on screen and is swapped when the
 * batch resolves - never a blank or a raw key.
 */
const TranslationContext = createContext(null);

export const SOURCE_LOCALE = "fr";

/** Locales written right-to-left, so the document direction can follow the language. */
const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);

// LibreTranslate pivots (fr -> en -> ar), which costs real time: measured at roughly 0.4s per
// string. A chunk of 40 therefore takes ~16s, and several of those in parallel queue up behind
// each other inside LibreTranslate until they pass the backend's 30s read timeout - at which
// point the backend gives up and returns the French unchanged. Small chunks, sent one after
// the other, keep every request comfortably inside that budget.
const CHUNK_SIZE = 12;
const DEBOUNCE_MS = 120;
// Cap the persisted cache so a long browsing session cannot grow localStorage without bound.
const MAX_PERSISTED = 3000;

// Bumped whenever a bug could have written bad entries: the key changes, so stale caches are
// abandoned instead of having to be cleared by hand. v1 could persist untranslated text.
const CACHE_VERSION = "v2";

const storageKey = (locale) => `gm_tr:${CACHE_VERSION}:${SOURCE_LOCALE}:${locale}`;

const readPersisted = (locale) => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(storageKey(locale)) || "{}");
  } catch {
    return {};
  }
};

const writePersisted = (locale, entries) => {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(entries);
    const trimmed =
      keys.length > MAX_PERSISTED
        ? Object.fromEntries(
            keys.slice(keys.length - MAX_PERSISTED).map((k) => [k, entries[k]])
          )
        : entries;
    window.localStorage.setItem(storageKey(locale), JSON.stringify(trimmed));
  } catch {
    // Quota or private mode - the in-memory cache still works for this session.
  }
};

const pickBase = (obj, locale) => {
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] ?? obj.fr ?? obj.en ?? Object.values(obj)[0] ?? "";
};

export const TranslationProvider = ({ children }) => {
  const router = useRouter();
  const locale = router?.locale || Cookies.get("_lang") || SOURCE_LOCALE;
  const isSource = locale === SOURCE_LOCALE;

  // `cache` drives re-renders for the React-facing helpers; `cacheRef` is what the async
  // machinery reads, so a queued batch never races a stale closure.
  const [cache, setCache] = useState({});
  const cacheRef = useRef({});
  const pending = useRef(new Map()); // source text -> Promise, so it is requested once
  const queue = useRef(new Set());
  const timer = useRef(null);

  // Swap the whole cache when the language changes, seeding from localStorage.
  useEffect(() => {
    if (isSource) {
      cacheRef.current = {};
      setCache({});
      return;
    }
    const persisted = readPersisted(locale);
    cacheRef.current = persisted;
    setCache(persisted);
  }, [locale, isSource]);

  // The document's `dir` and `lang` are set once, by I18nProvider, from the same routed
  // locale this provider reads. Two writers of one attribute is one too many: they can only
  // ever agree or contradict each other, and the second case is a page laid out backwards.

  const commit = useCallback(
    (pairs) => {
      if (!pairs.length) return;
      const next = { ...cacheRef.current };
      pairs.forEach(([src, out]) => {
        next[src] = out;
      });
      cacheRef.current = next;
      setCache(next);
      writePersisted(locale, next);
    },
    [locale]
  );

  /**
   * Translate a list of French strings, resolving to a `{ source: translated }` map.
   *
   * Safe to call with anything: cached strings resolve immediately, in-flight strings share
   * the existing request, and a failure resolves to the source text rather than rejecting -
   * the store must stay readable when LibreTranslate is down or still loading its models.
   *
   * Chunks are sent **sequentially**. Firing them in parallel does not make LibreTranslate
   * any faster - it translates one batch at a time - it only makes the later requests wait in
   * its queue until they exceed the backend's read timeout and come back untranslated.
   */
  const translateBatch = useCallback(
    async (texts = []) => {
      const wanted = [...new Set(texts.filter((s) => s && s.trim()))];
      if (isSource || !wanted.length) {
        return Object.fromEntries(wanted.map((s) => [s, s]));
      }

      const misses = wanted.filter(
        (s) => cacheRef.current[s] === undefined && !pending.current.has(s)
      );

      const sendChunk = async (chunk) => {
        try {
          const res = await TranslationServices.translate({
            q: chunk,
            source: SOURCE_LOCALE,
            target: locale,
          });
          const out = res?.translatedText || [];
          // Cache only genuine translations. The backend answers best-effort: when
          // LibreTranslate times out or has not loaded the target model, it returns the
          // source text unchanged. Storing that would pin the French permanently - the bug
          // that made the Arabic switch look like it did nothing at all. Leaving a no-op
          // uncached costs one retry on the next pass and fixes itself once the model warms.
          commit(
            chunk
              .map((src, j) => [src, out[j]])
              .filter(([src, translated]) => translated && translated !== src)
          );
        } catch {
          // Best-effort: leave the French in place and let a later render retry.
        } finally {
          chunk.forEach((s) => pending.current.delete(s));
        }
      };

      const chunks = [];
      for (let i = 0; i < misses.length; i += CHUNK_SIZE) {
        chunks.push(misses.slice(i, i + CHUNK_SIZE));
      }

      // One promise per chunk, registered up front so a concurrent caller asking for the same
      // string waits on it rather than requesting it again - but awaited in series.
      const queue = chunks.reduce(
        (previous, chunk) => previous.then(() => sendChunk(chunk)),
        Promise.resolve()
      );
      chunks.flat().forEach((s) => pending.current.set(s, queue));

      const requests = [queue];
      // Also wait on anything another caller already has in flight.
      wanted.forEach((s) => {
        const inFlight = pending.current.get(s);
        if (inFlight && !requests.includes(inFlight)) requests.push(inFlight);
      });

      await Promise.all(requests);
      return Object.fromEntries(
        wanted.map((s) => [s, cacheRef.current[s] ?? s])
      );
    },
    [isSource, locale, commit]
  );

  // Render-time lookup: returns what we have now and schedules anything missing.
  const enqueue = useCallback(
    (text) => {
      if (!text || cacheRef.current[text] !== undefined) return;
      queue.current.add(text);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const batch = [...queue.current];
        queue.current.clear();
        translateBatch(batch);
      }, DEBOUNCE_MS); // coalesce a render's worth of strings into one request
    },
    [translateBatch]
  );

  const lookup = useCallback(
    (text) => {
      if (isSource || !text) return text;
      const hit = cache[text];
      if (hit !== undefined) return hit;
      enqueue(text);
      return text;
    },
    [isSource, cache, enqueue]
  );

  // Dynamic values: a multilingual object ({ fr/en/ar }) or a plain string.
  const translateValue = useCallback(
    (obj) => {
      const base = pickBase(obj, locale);
      if (isSource || !base) return base;
      // A value the database already carries in this language wins over machine translation.
      if (typeof obj === "object" && obj?.[locale]) return obj[locale];
      return lookup(base);
    },
    [locale, isSource, lookup]
  );

  const value = useMemo(
    () => ({
      locale,
      isSource,
      isRTL: RTL_LOCALES.has(locale),
      // `t` takes the French string itself - there is no key to look up.
      t: lookup,
      translateValue,
      translateBatch,
    }),
    [locale, isSource, lookup, translateValue, translateBatch]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

// Safe default so components work even if rendered outside the provider (SSR edge cases).
export const useTranslate = () => {
  const ctx = useContext(TranslationContext);
  return (
    ctx || {
      locale: SOURCE_LOCALE,
      isSource: true,
      isRTL: false,
      t: (x) => x,
      translateValue: (o) => pickBase(o, SOURCE_LOCALE),
      translateBatch: async (texts = []) =>
        Object.fromEntries(texts.map((s) => [s, s])),
    }
  );
};

export default TranslationContext;
