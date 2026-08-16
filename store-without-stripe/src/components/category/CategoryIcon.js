import {
  TbShoppingCart,
  TbShoppingBag,
  TbGrain,
  TbBread,
  TbBottleFilled,
  TbCandy,
  TbSalt,
  TbPepper,
  TbCoffee,
  TbCup,
  TbSoup,
  TbBottle,
  TbDroplet,
  TbGlassFull,
  TbBeer,
  TbSparkles,
  TbBucket,
  TbMilk,
  TbCheese,
  TbEgg,
  TbMeat,
  TbFish,
  TbApple,
  TbCarrot,
  TbCookie,
  TbBabyBottle,
  TbLeaf,
  TbToolsKitchen2,
  TbFlask,
} from "react-icons/tb";

/**
 * Premium line-icon set for product categories (Tabler icons — one consistent stroke weight).
 * The database stores the short KEY (e.g. "oil", "coffee") in the category `icon` column, and
 * both the admin picker and the storefront render the matching component. Keep this catalogue
 * in sync with the admin copy in `admin/src/utils/categoryIcons.jsx`.
 */
export const CATEGORY_ICONS = [
  { key: "cart", label: "Général", Icon: TbShoppingCart },
  { key: "bag", label: "Divers", Icon: TbShoppingBag },
  { key: "rice", label: "Riz & céréales", Icon: TbGrain },
  { key: "bakery", label: "Farines & pains", Icon: TbBread },
  { key: "oil", label: "Huiles", Icon: TbBottleFilled },
  { key: "sugar", label: "Sucre & confiseries", Icon: TbCandy },
  { key: "salt", label: "Sel", Icon: TbSalt },
  { key: "spices", label: "Épices", Icon: TbPepper },
  { key: "coffee", label: "Café", Icon: TbCoffee },
  { key: "tea", label: "Thé", Icon: TbCup },
  { key: "canned", label: "Conserves", Icon: TbSoup },
  { key: "drinks", label: "Boissons", Icon: TbBottle },
  { key: "water", label: "Eau", Icon: TbDroplet },
  { key: "juice", label: "Jus", Icon: TbGlassFull },
  { key: "beer", label: "Bières & alcools", Icon: TbBeer },
  { key: "cleaning", label: "Détergents & hygiène", Icon: TbSparkles },
  { key: "care", label: "Entretien", Icon: TbBucket },
  { key: "dairy", label: "Produits laitiers", Icon: TbMilk },
  { key: "cheese", label: "Fromages", Icon: TbCheese },
  { key: "eggs", label: "Œufs", Icon: TbEgg },
  { key: "meat", label: "Viandes", Icon: TbMeat },
  { key: "fish", label: "Poissons", Icon: TbFish },
  { key: "fruits", label: "Fruits", Icon: TbApple },
  { key: "vegetables", label: "Légumes", Icon: TbCarrot },
  { key: "snacks", label: "Biscuits & snacks", Icon: TbCookie },
  { key: "baby", label: "Bébé", Icon: TbBabyBottle },
  { key: "organic", label: "Bio & naturel", Icon: TbLeaf },
  { key: "kitchen", label: "Épicerie", Icon: TbToolsKitchen2 },
  { key: "lab", label: "Chimie & produits", Icon: TbFlask },
];

const BY_KEY = CATEGORY_ICONS.reduce((acc, item) => {
  acc[item.key] = item.Icon;
  return acc;
}, {});

// Older categories stored a keyword or an emoji instead of a catalogue key — map them across
// so existing data keeps rendering a proper icon.
const ALIASES = {
  grain: "rice",
  cereal: "rice",
  cereals: "rice",
  wheat: "bakery",
  flour: "bakery",
  semolina: "bakery",
  bread: "bakery",
  cube: "sugar",
  sweet: "sugar",
  sweets: "sugar",
  candy: "sugar",
  cup: "coffee",
  can: "canned",
  conserve: "canned",
  bottle: "drinks",
  drink: "drinks",
  beverage: "drinks",
  soap: "cleaning",
  detergent: "cleaning",
  hygiene: "cleaning",
  clean: "cleaning",
  milk: "dairy",
  fruit: "fruits",
  vegetable: "vegetables",
  spice: "spices",
  snack: "snacks",
  // legacy emojis
  "🛒": "cart",
  "📦": "bag",
  "🍚": "rice",
  "🌾": "rice",
  "🍞": "bakery",
  "🥖": "bakery",
  "🫒": "oil",
  "🧊": "sugar",
  "🍫": "sugar",
  "🍬": "sugar",
  "🧂": "salt",
  "🌶️": "spices",
  "☕": "coffee",
  "🍵": "tea",
  "🥫": "canned",
  "🥤": "drinks",
  "💧": "water",
  "🍺": "beer",
  "🍷": "beer",
  "🧴": "cleaning",
  "🧼": "cleaning",
  "🪣": "care",
  "🥛": "dairy",
  "🧀": "cheese",
  "🥚": "eggs",
  "🥩": "meat",
  "🐟": "fish",
  "🍎": "fruits",
  "🍊": "fruits",
  "🥕": "vegetables",
  "🥦": "vegetables",
  "🥬": "vegetables",
  "🍪": "snacks",
  "🍼": "baby",
  "🌿": "organic",
};

export function resolveCategoryIcon(value) {
  if (!value || typeof value !== "string") return TbShoppingCart;
  const raw = value.trim();
  if (BY_KEY[raw]) return BY_KEY[raw];
  const key = ALIASES[raw] || ALIASES[raw.toLowerCase()];
  if (key && BY_KEY[key]) return BY_KEY[key];
  // try the first meaningful token, e.g. "grain-cereals" -> "grain"
  const token = raw
    .toLowerCase()
    .split(/[\s&,/-]+/)
    .find((t) => ALIASES[t] || BY_KEY[t]);
  if (token) return BY_KEY[ALIASES[token] || token];
  return TbShoppingCart;
}

const CategoryIcon = ({ icon, className = "h-6 w-6" }) => {
  const Icon = resolveCategoryIcon(icon);
  return <Icon className={className} />;
};

export default CategoryIcon;
