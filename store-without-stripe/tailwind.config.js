/**
 * Grossimarché design tokens.
 *
 * The storefront is meant to read as a premium wholesale house, not a discount grocery
 * template. Two deliberate choices shape this file:
 *
 * 1. `emerald` is *redefined* rather than supplemented. Hundreds of existing class names
 *    already say `emerald-500`; remapping the scale to a deep, desaturated forest green
 *    upgrades every one of them at once instead of leaving two greens fighting.
 * 2. `font-serif` is a legacy alias kept on the body sans on purpose - it is applied to
 *    buttons and 10px labels all over the codebase, where a display serif would look wrong.
 *    Real editorial headings opt in with `font-display`.
 */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/layout/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    fontFamily: {
      sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      // Legacy alias - see the note above. Not an actual serif.
      serif: ["Inter", "system-ui", "sans-serif"],
      display: ["Fraunces", "Georgia", "Cambria", "serif"],
      DejaVu: ["DejaVu Sans", "Arial", "sans-serif"],
    },
    extend: {
      colors: {
        // Primary brand green. Deeper and less saturated than Tailwind's emerald so large
        // flat fills (navbar, buttons) read as considered rather than fluorescent.
        emerald: {
          50: "#F2F7F3",
          100: "#E1EDE4",
          200: "#C2D9C8",
          300: "#98BCA3",
          400: "#6A9878",
          500: "#3F7355",
          600: "#2F5B43",
          700: "#264936",
          800: "#1E392B",
          900: "#172C21",
        },
        // Accent, used sparingly: prices under discount, tier badges, premium markers.
        brass: {
          50: "#FBF7EF",
          100: "#F4EAD4",
          200: "#E8D3A8",
          300: "#D9B876",
          400: "#C79E4C",
          500: "#AC853B",
          600: "#8A692E",
        },
        // Warm neutral ground. `cream` is the page, `sand` the recessed surface.
        cream: "#FBF9F5",
        sand: "#F4F1EA",
        line: "#E8E3D8",
        ink: {
          50: "#F7F7F6",
          100: "#EDEDEA",
          200: "#DCDCD6",
          300: "#B9B9B1",
          400: "#8C8C84",
          500: "#6B6B63",
          600: "#50504A",
          700: "#3B3B36",
          800: "#26261F",
          900: "#15150F",
        },
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      letterSpacing: {
        luxe: "0.18em",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        // Soft, wide and low-opacity - the "expensive" shadow. Never a hard drop shadow.
        luxe: "0 1px 2px rgba(21,21,15,0.04), 0 8px 24px -12px rgba(21,21,15,0.12)",
        "luxe-lg": "0 2px 4px rgba(21,21,15,0.04), 0 24px 48px -20px rgba(21,21,15,0.18)",
        inset: "inset 0 0 0 1px rgba(21,21,15,0.06)",
      },
      height: {
        header: "560px",
      },
      backgroundImage: {
        "page-header": "url('/page-header-bg.jpg')",
        "contact-header": "url('/page-header-bg-2.jpg')",
        subscribe: "url('/subscribe-bg.jpg')",
        "app-download": "url('/app-download.jpg')",
        cta: "url('/cta-bg.png')",
        "cta-1": "url('/cta/cta-bg-1.png')",
        "cta-2": "url('/cta/cta-bg-2.png')",
        "cta-3": "url('/cta/cta-bg-3.png')",
      },
      keyframes: {
        // Cart badge: a short squash-and-pop the moment the count changes.
        "badge-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.45)" },
          "100%": { transform: "scale(1)" },
        },
        "cart-nudge": {
          "0%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-3px)" },
          "60%": { transform: "translateY(1px)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", maxHeight: "0" },
          to: { opacity: "1", maxHeight: "200px" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "badge-pop": "badge-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "cart-nudge": "cart-nudge 500ms ease-out",
        "fade-up": "fade-up 400ms ease-out both",
        "slide-down": "slide-down 260ms ease-out both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
