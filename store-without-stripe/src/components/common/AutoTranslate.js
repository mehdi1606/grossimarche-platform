import { useEffect } from "react";
import { useRouter } from "next/router";

import { useTranslate } from "@context/TranslationContext";

/**
 * Translates the rendered page itself.
 *
 * The alternative — a `t("checkout.confirm_button")` key for every string, and a JSON
 * catalogue per language — means every new label is a four-file change and every untranslated
 * key ships as either English or a raw key. This walks what the browser actually painted,
 * sends the French it finds to LibreTranslate in batches, and writes the result back. A new
 * page, a new button, a page nobody remembered to wire up: all translated, with no per-string
 * work and nothing to keep in sync.
 *
 * It is a no-op on the source locale, so French visitors pay nothing at all.
 *
 * What it deliberately does *not* touch:
 *   - anything inside `[data-no-translate]` or `[translate="no"]` — brand name, prices,
 *     invoice numbers, e-mail addresses;
 *   - text with no letters in it (amounts, dates, phone numbers, ISO codes);
 *   - script/style/code/pre and editable fields.
 */

// Compared against an upper-cased tagName: HTML elements report it upper-case already, but
// SVG elements preserve their authored case ("svg", "path"), so they would slip through a
// plain lookup.
const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "KBD",
  "SAMP",
  "TEXTAREA",
  "SVG",
  "PATH",
]);

const isSkippedTag = (element) =>
  SKIP_TAGS.has(String(element.tagName || "").toUpperCase());

// Attributes that are read out loud or shown to the visitor.
const TEXT_ATTRIBUTES = ["placeholder", "title", "aria-label", "alt"];

const HAS_LETTER = /\p{L}/u;

// Short all-caps tokens are codes, not words: currency (DH, MAD, EUR), tax labels (TTC, HT),
// ISO language badges. Machine-translating them produces noise at best.
const CODE_TOKEN = /^[\p{Lu}€$£¥.]{1,4}$/u;

// A whole render pass is capped so a pathological page cannot fire thousands of requests.
const MAX_NODES_PER_PASS = 600;
const DEBOUNCE_MS = 150;
// How many strings are translated and written back before the next slice starts. Matches the
// engine's chunk size, so each slice is exactly one request and the page updates as it lands.
const APPLY_BATCH = 12;

const isTranslatable = (text) => {
  if (typeof text !== "string") return false;
  const trimmed = text.trim();
  return (
    trimmed.length > 1 &&
    trimmed.length <= 2000 &&
    HAS_LETTER.test(trimmed) &&
    !CODE_TOKEN.test(trimmed)
  );
};

const AutoTranslate = () => {
  const router = useRouter();
  const { isSource, locale, translateBatch } = useTranslate();

  useEffect(() => {
    if (isSource || typeof document === "undefined") return undefined;

    // Original French per node, so a node is always translated from its source text and never
    // from a previous translation. WeakMap: detached nodes are collected with the DOM.
    const originals = new WeakMap();
    const applied = new WeakMap();

    let observer;
    let timer;
    let cancelled = false;

    /** Collect every translatable text node and attribute currently on the page. */
    const collect = () => {
      const textNodes = [];
      const attributeTargets = [];

      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
          acceptNode(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Prune whole subtrees rather than testing every descendant text node.
              if (
                isSkippedTag(node) ||
                node.hasAttribute("data-no-translate") ||
                node.getAttribute("translate") === "no"
              ) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
            return isTranslatable(node.nodeValue)
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          },
        }
      );

      let node = walker.nextNode();
      while (node && textNodes.length + attributeTargets.length < MAX_NODES_PER_PASS) {
        if (node.nodeType === Node.TEXT_NODE) {
          const current = node.nodeValue;
          // Already showing the translation we produced for this node — leave it alone.
          if (applied.get(node) !== current) {
            if (!originals.has(node)) originals.set(node, current);
            textNodes.push(node);
          }
        } else {
          TEXT_ATTRIBUTES.forEach((name) => {
            const value = node.getAttribute?.(name);
            if (!isTranslatable(value)) return;
            const key = `${name}`;
            const seen = applied.get(node) || {};
            if (seen[key] === value) return;
            const store = originals.get(node) || {};
            if (store[key] === undefined) {
              store[key] = value;
              originals.set(node, store);
            }
            attributeTargets.push({ element: node, name });
          });
        }
        node = walker.nextNode();
      }

      return { textNodes, attributeTargets };
    };

    /**
     * How far down the page an element sits. Used to translate what the visitor is looking at
     * before what they would have to scroll to: machine translation costs roughly half a
     * second per string, so on a cold cache a whole page takes a while, and the difference
     * between "the header flips in a few seconds" and "nothing happens for a minute" is
     * entirely a question of what we ask for first.
     */
    const verticalPosition = (node) => {
      const element =
        node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
      try {
        const rect = element?.getBoundingClientRect();
        // Elements that are not laid out (display:none, detached) go last.
        return rect && (rect.width || rect.height) ? rect.top : Number.MAX_SAFE_INTEGER;
      } catch {
        return Number.MAX_SAFE_INTEGER;
      }
    };

    /** Write one batch of results into the DOM. */
    const applyBatch = (targets, translations) => {
      // Stop observing our own writes, so the observer cannot re-trigger this pass in a loop.
      observer?.disconnect();

      targets.forEach(({ node, name, source }) => {
        const out = translations[source];
        if (!out || out === source) return;

        if (name) {
          node.setAttribute(name, out);
          applied.set(node, { ...(applied.get(node) || {}), [name]: out });
          return;
        }
        // Preserve the original leading/trailing whitespace — it is doing layout work.
        const raw = originals.get(node) || source;
        const [, lead = "", , trail = ""] = raw.match(/^(\s*)([\s\S]*?)(\s*)$/) || [];
        const next = `${lead}${out}${trail}`;
        node.nodeValue = next;
        applied.set(node, next);
      });

      if (!cancelled) observer?.observe(document.body, observeOptions);
    };

    const run = async () => {
      const { textNodes, attributeTargets } = collect();
      if (!textNodes.length && !attributeTargets.length) return;

      const targets = [
        ...textNodes.map((node) => ({
          node,
          name: null,
          source: (originals.get(node) || "").trim(),
          top: verticalPosition(node),
        })),
        ...attributeTargets.map(({ element, name }) => ({
          node: element,
          name,
          source: (originals.get(element)?.[name] || "").trim(),
          top: verticalPosition(element),
        })),
      ]
        .filter((target) => target.source)
        .sort((a, b) => a.top - b.top);

      // Translate and apply in slices rather than waiting for the whole page: on a cold cache
      // the full set takes far longer than anyone will stare at an unchanged screen, so the
      // top of the page must flip while the rest is still being fetched.
      for (let i = 0; i < targets.length; i += APPLY_BATCH) {
        const slice = targets.slice(i, i + APPLY_BATCH);
        const translations = await translateBatch(slice.map((t) => t.source));
        if (cancelled) return;
        applyBatch(slice, translations);
      }
    };

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(run, DEBOUNCE_MS);
    };

    const observeOptions = {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TEXT_ATTRIBUTES,
    };

    observer = new MutationObserver(schedule);
    observer.observe(document.body, observeOptions);
    schedule();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      observer.disconnect();
    };
    // `router.asPath` re-arms the pass on navigation, where a client-side route change can
    // swap the whole page without a single mutation the observer would see first.
  }, [isSource, locale, translateBatch, router.asPath]);

  return null;
};

export default AutoTranslate;
