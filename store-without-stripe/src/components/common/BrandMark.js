import Link from "next/link";

/**
 * The Grossimarché mark: a serif monogram, not a shopping-cart glyph.
 *
 * The logo used to be a `FiShoppingCart`, which put the exact same icon in the navbar twice -
 * once as the brand and once as the cart button, forty pixels apart. A monogram separates
 * identity from action, and reads as a house rather than a template.
 */
const BrandMark = ({ variant = "light", withWordmark = true, className = "", href = "/" }) => {
  // `light` = the mark sits on the dark green navbar; `dark` = on cream/white surfaces.
  const onDark = variant === "light";

  const content = (
    <>
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-lg font-semibold leading-none ring-1 transition ${
          onDark
            ? "bg-cream/95 text-emerald-700 ring-white/25"
            : "bg-emerald-600 text-cream ring-emerald-700/20"
        }`}
        aria-hidden="true"
      >
        G
      </span>
      {withWordmark && (
        <span
          className={`font-display text-xl font-semibold leading-none tracking-tight ${
            onDark ? "text-white" : "text-ink-800"
          }`}
        >
          Grossi
          <span className={onDark ? "text-emerald-100" : "text-emerald-600"}>marché</span>
        </span>
      )}
    </>
  );

  // `data-no-translate` stops the runtime translation pass (see AutoTranslate) from turning
  // the brand into a common noun - "Grossimarché" is a name in every language.
  if (!href) {
    return (
      <span data-no-translate className={`flex items-center gap-2.5 ${className}`}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      data-no-translate
      aria-label="Grossimarché - accueil"
      className={`flex items-center gap-2.5 ${className}`}
    >
      {content}
    </Link>
  );
};

export default BrandMark;
