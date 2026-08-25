/**
 * Product illustrations.
 *
 * A wholesale catalogue is mostly sacks, drums and cartons, and photographing every reference
 * takes weeks. Until real photos exist, this draws the *kind* of thing each product is - a
 * 25kg sack looks like a sack, a 5L bidon looks like a bidon - so a buyer scanning the grid
 * can tell a sack of flour from a drum of oil at a glance, which two letters on a tile could
 * never do.
 *
 * They are vector drawings, not images: nothing to download, they stay sharp at any size, and
 * they take their colour from the tile they sit on. Every one shares a 96×96 canvas and the
 * same two-tone treatment (soft fill, darker outline), so a grid of them reads as one set
 * rather than as clip-art.
 *
 * A real uploaded photo always wins - see ProductImage.
 */

// `body` is the light fill, `line` the outline; both are passed in by the tile.
const shell = (children) => ({ body, line }) => (
  <svg
    viewBox="0 0 96 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="h-full w-full"
  >
    {children({ body, line })}
  </svg>
);

/** Jerrycan - cooking oil in 5L / 20L bidons. */
const Bidon = shell(({ body, line }) => (
  <g stroke={line} strokeWidth="2.5" strokeLinejoin="round">
    <path d="M30 34h30a6 6 0 0 1 6 6v34a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6V40a6 6 0 0 1 6-6Z" fill={body} />
    <path d="M40 34v-6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v6" fill={body} />
    <rect x="56" y="18" width="14" height="9" rx="2.5" fill={body} />
    <path d="M32 46h26v16H32z" fill="none" strokeWidth="2" opacity=".55" />
  </g>
));

/** Bottle - olive oil, vinegar, anything sold by the bottle. */
const Bottle = shell(({ body, line }) => (
  <g stroke={line} strokeWidth="2.5" strokeLinejoin="round">
    <path d="M42 16h12v12l8 12a10 10 0 0 1 2 6v26a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6V46a10 10 0 0 1 2-6l8-12V16Z" fill={body} />
    <path d="M34 52h28" strokeWidth="2" opacity=".55" />
    <path d="M40 12h16" strokeWidth="3" strokeLinecap="round" />
  </g>
));

/** Sack - flour, semolina, rice, sugar, detergent: the shape of wholesale. */
const Sack = shell(({ body, line }) => (
  <g stroke={line} strokeWidth="2.5" strokeLinejoin="round">
    <path d="M34 28c0 6-6 8-6 18v26a6 6 0 0 0 6 6h28a6 6 0 0 0 6-6V46c0-10-6-12-6-18Z" fill={body} />
    <path d="M34 28c4-3 6-4 14-4s10 1 14 4" fill={body} />
    <path d="M38 50h20M38 60h20" strokeWidth="2" strokeLinecap="round" opacity=".5" />
  </g>
));

/** Carton - the default for anything boxed by the dozen. */
const Carton = shell(({ body, line }) => (
  <g stroke={line} strokeWidth="2.5" strokeLinejoin="round">
    <path d="M24 36l24-12 24 12v34L48 82 24 70V36Z" fill={body} />
    <path d="M24 36l24 12 24-12M48 48v34" strokeWidth="2" opacity=".55" />
  </g>
));

/** Tin - sardines, tomato concentrate, preserves. */
const Tin = shell(({ body, line }) => (
  <g stroke={line} strokeWidth="2.5" strokeLinejoin="round">
    <ellipse cx="48" cy="34" rx="22" ry="9" fill={body} />
    <path d="M26 34v28c0 5 10 9 22 9s22-4 22-9V34" fill={body} />
    <ellipse cx="48" cy="34" rx="13" ry="5" strokeWidth="2" opacity=".5" />
  </g>
));

/** Bottle pack - water and soft drinks sold by the shrink-wrapped pack. */
const Pack = shell(({ body, line }) => (
  <g stroke={line} strokeWidth="2.5" strokeLinejoin="round">
    {[26, 42, 58].map((x) => (
      <path
        key={x}
        d={`M${x} 34h12v34a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V34Z`}
        fill={body}
      />
    ))}
    {[26, 42, 58].map((x) => (
      <path key={`n${x}`} d={`M${x + 4} 34v-7h4v7`} fill={body} />
    ))}
    <path d="M22 44h52" strokeWidth="2" opacity=".45" />
  </g>
));

/** Coffee / tea - a scooped bag. */
const Bag = shell(({ body, line }) => (
  <g stroke={line} strokeWidth="2.5" strokeLinejoin="round">
    <path d="M32 34h32l-3 40a6 6 0 0 1-6 5H41a6 6 0 0 1-6-5l-3-40Z" fill={body} />
    <path d="M32 34l4-12h24l4 12" fill={body} />
    <path d="M40 50h16" strokeWidth="2" strokeLinecap="round" opacity=".5" />
  </g>
));

/** Fresh produce - fruit and vegetables sold by the kilo. */
const Produce = shell(({ body, line }) => (
  <g stroke={line} strokeWidth="2.5" strokeLinejoin="round">
    <path d="M48 32c-4-5-12-6-17-2-6 5-7 15-3 25 3 8 9 17 15 17 2 0 3-1 5-1s3 1 5 1c6 0 12-9 15-17 4-10 3-20-3-25-5-4-13-3-17 2Z" fill={body} />
    <path d="M48 32V20" strokeLinecap="round" />
    <path d="M48 24c5-6 11-6 13-6 0 6-5 10-13 8Z" fill={body} />
  </g>
));

/** Soap / hygiene - a stacked bar. */
const Bar = shell(({ body, line }) => (
  <g stroke={line} strokeWidth="2.5" strokeLinejoin="round">
    <path d="M24 46a6 6 0 0 1 6-6h36a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6v-6Z" fill={body} />
    <path d="M28 58h40v10a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6V58Z" fill={body} />
    <path d="M36 49h24" strokeWidth="2" strokeLinecap="round" opacity=".5" />
  </g>
));

/**
 * Which drawing fits a product. Matched on the name and unit together, because the unit is
 * often where the packaging actually lives ("sac 50 kg", "carton 12x1 L").
 *
 * Order matters: the first hit wins, so the more specific patterns come first.
 */
const RULES = [
  // Drinks are tested before fresh produce, so "Jus d'orange" is a carton of juice rather
  // than an orange.
  {
    glyph: Pack,
    tint: "drink",
    test: /\beaux?\b|\bsoda\b|\bcola\b|boisson|\bjus\b|limonade|\bpack\b/i,
  },
  {
    glyph: Produce,
    tint: "produce",
    test: /\bpomme|\bfruit|l[ée]gume|\btomate|\borange|\bbanane|\boignon|\bpatate/i,
  },
  {
    glyph: Bar,
    tint: "hygiene",
    test: /savon|shampo|d[ée]tergent|hygi[èe]ne|javel|nettoyant/i,
  },
  {
    glyph: Sack,
    tint: "grain",
    // "\bsac\b" rather than "sac", or it fires inside "sachet", "sacoche" and anything else
    // that merely contains those three letters.
    test: /\bsacs?\b|farine|semoule|\briz\b|couscous|lentille|\bpois\b|haricot|sucre en poudre|lessive/i,
  },
  {
    glyph: Tin,
    tint: "preserve",
    test: /conserve|sardine|\bthon\b|concentr[ée]|bo[îi]te de/i,
  },
  {
    glyph: Bag,
    tint: "coffee",
    // "\b" is ASCII-only, so it never fires after an accent - "Thé " would silently fail to
    // match. Hence the explicit "not followed by a letter" lookahead instead.
    test: /caf[ée]|th[ée](?![a-zà-ÿ])|cacao|chocolat en poudre/i,
  },
  { glyph: Bidon, tint: "oil", test: /bidon|huile/i },
  { glyph: Bottle, tint: "oil", test: /bouteille|vinaigre|sirop/i },
  { glyph: Carton, tint: "default", test: /carton|\blots?\b|paquet|sucre/i },
];

const FALLBACK = { glyph: Carton, tint: "default" };

/** Pick the drawing (and its colour family) for a product. */
export const glyphFor = (name = "", unit = "") => {
  const haystack = `${name} ${unit}`;
  return RULES.find((rule) => rule.test.test(haystack)) || FALLBACK;
};

export default glyphFor;
