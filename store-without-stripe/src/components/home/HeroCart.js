/**
 * Glass shopping trolley for the hero — an inline SVG rather than an image: it scales at any
 * size, weighs nothing, and its translucency lets the green gradient show through, which is
 * the whole point of the effect.
 *
 * Everything is white at low opacity (frosted glass over the emerald background); the
 * floating bubbles reuse the site's gm-float classes, so they also stop under
 * prefers-reduced-motion like the rest of the page.
 */
const HeroCart = ({ className = "" }) => (
  <svg
    viewBox="0 0 420 340"
    role="img"
    aria-label="Chariot de marché rempli de produits"
    className={className}
  >
    <defs>
      {/* Soft glow behind the trolley, so the glass reads as lit from within */}
      <radialGradient id="gmGlow" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      {/* Basket glass: brighter at the top edge, fading down */}
      <linearGradient id="gmGlass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.30" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="gmBubble" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
      </linearGradient>
    </defs>

    <circle cx="210" cy="150" r="150" fill="url(#gmGlow)" />

    {/* Free-floating bubbles around the trolley */}
    <g className="gm-float">
      <circle cx="86" cy="58" r="14" fill="url(#gmBubble)" stroke="#ffffff" strokeOpacity="0.35" />
      <circle cx="352" cy="112" r="9" fill="url(#gmBubble)" stroke="#ffffff" strokeOpacity="0.3" />
    </g>
    <g className="gm-float-slow">
      <circle cx="330" cy="44" r="20" fill="url(#gmBubble)" stroke="#ffffff" strokeOpacity="0.3" />
      <circle cx="52" cy="196" r="10" fill="url(#gmBubble)" stroke="#ffffff" strokeOpacity="0.28" />
    </g>

    {/* Goods stacked in the basket — bubbles again, so the glass stays readable */}
    <g className="gm-float">
      <circle cx="150" cy="118" r="30" fill="url(#gmBubble)" stroke="#ffffff" strokeOpacity="0.4" />
      <circle cx="212" cy="104" r="22" fill="#ffffff" fillOpacity="0.22" stroke="#ffffff" strokeOpacity="0.35" />
      <circle cx="262" cy="120" r="26" fill="url(#gmBubble)" stroke="#ffffff" strokeOpacity="0.35" />
      {/* highlights */}
      <circle cx="140" cy="108" r="6" fill="#ffffff" fillOpacity="0.5" />
      <circle cx="255" cy="111" r="4" fill="#ffffff" fillOpacity="0.45" />
    </g>

    {/* Handle */}
    <path
      d="M28 62h34a14 14 0 0 1 13.4 9.9L92 132"
      fill="none"
      stroke="#ffffff"
      strokeOpacity="0.55"
      strokeWidth="7"
      strokeLinecap="round"
    />

    {/* Basket */}
    <path
      d="M96 140h230l-26 104a20 20 0 0 1-19.4 15H141.4A20 20 0 0 1 122 244z"
      fill="url(#gmGlass)"
      stroke="#ffffff"
      strokeOpacity="0.6"
      strokeWidth="5"
      strokeLinejoin="round"
    />
    {/* Basket grid: the classic trolley mesh, kept faint */}
    <g stroke="#ffffff" strokeOpacity="0.28" strokeWidth="3" strokeLinecap="round">
      <path d="M139 148l16 104M180 148l10 104M221 148l2 104M262 148l-6 104M303 148l-14 104" />
      <path d="M104 178h214M112 212h198" />
    </g>
    {/* Rim highlight */}
    <path d="M96 140h230" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="6" strokeLinecap="round" />

    {/* Legs + wheels */}
    <path
      d="M150 259l-8 26M290 259l8 26"
      stroke="#ffffff"
      strokeOpacity="0.5"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <circle cx="140" cy="298" r="16" fill="#ffffff" fillOpacity="0.18" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="5" />
    <circle cx="300" cy="298" r="16" fill="#ffffff" fillOpacity="0.18" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="5" />
  </svg>
);

export default HeroCart;
