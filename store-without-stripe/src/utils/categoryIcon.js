// Category icons in the database are stored as short text keywords
// (e.g. "grain", "oil", "soap") rather than emojis or image URLs.
// This helper turns whatever is stored into a display emoji so the
// storefront never shows a raw word or a broken <img>.

const KEYWORD_EMOJI = {
  grain: "🌾",
  cereal: "🌾",
  cereals: "🌾",
  rice: "🌾",
  wheat: "🌾",
  flour: "🌾",
  semolina: "🌾",
  oil: "🫒",
  olive: "🫒",
  sugar: "🧊",
  cube: "🧊",
  salt: "🧂",
  tea: "🍵",
  coffee: "☕",
  cup: "☕",
  can: "🥫",
  canned: "🥫",
  conserve: "🥫",
  bottle: "🧴",
  drink: "🥤",
  drinks: "🥤",
  beverage: "🥤",
  water: "💧",
  milk: "🥛",
  dairy: "🥛",
  soap: "🧼",
  detergent: "🧼",
  hygiene: "🧼",
  clean: "🧼",
  cleaning: "🧼",
  bread: "🍞",
  bakery: "🍞",
  pasta: "🍝",
  meat: "🥩",
  fish: "🐟",
  fruit: "🍎",
  fruits: "🍎",
  vegetable: "🥦",
  vegetables: "🥦",
  spice: "🌶️",
  spices: "🌶️",
  snack: "🍪",
  snacks: "🍪",
  sweet: "🍬",
  sweets: "🍬",
  baby: "🍼",
  frozen: "🧊",
};

const DEFAULT_EMOJI = "🛒";

// Anything that isn't plain ASCII letters/spaces is assumed to already be an
// emoji (or non-latin glyph) and is passed through untouched.
const isPlainWord = (s) => /^[a-zA-Z\s&-]+$/.test(s);

export function categoryEmoji(icon) {
  if (!icon || typeof icon !== "string") return DEFAULT_EMOJI;
  const raw = icon.trim();
  if (!raw) return DEFAULT_EMOJI;

  // Real image URLs shouldn't be shown as text — fall back to the default.
  if (/^(https?:)?\/\//.test(raw) || raw.startsWith("/")) return DEFAULT_EMOJI;

  if (!isPlainWord(raw)) return raw; // already an emoji / glyph

  const key = raw.toLowerCase();
  if (KEYWORD_EMOJI[key]) return KEYWORD_EMOJI[key];

  // Try the first meaningful token (e.g. "grain-cereals" -> "grain").
  const token = key.split(/[\s&,/-]+/).find((t) => KEYWORD_EMOJI[t]);
  return token ? KEYWORD_EMOJI[token] : DEFAULT_EMOJI;
}

export default categoryEmoji;
