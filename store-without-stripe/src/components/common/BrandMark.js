import Image from "next/image";
import Link from "next/link";

/**
 * The Market Food mark.
 *
 * Two versions of one logo, because the shop puts it on two grounds: the reversed mark (white
 * basket and wordmark, gold produce) for the dark green navbar, footer and mobile drawer, and
 * the colour mark for cream and paper - the invoice above all. Both are keyed PNGs: the files
 * the designer supplied are JPG, and a JPG would paint a white rectangle across the navbar.
 *
 * `withWordmark={false}` falls back to the basket alone, which is what fits a phone's top bar.
 */
const RATIO = 900 / 219; // the horizontal lockup, as exported

const BrandMark = ({ variant = "light", withWordmark = true, className = "", href = "/" }) => {
  // `light` = the mark sits on the dark green navbar; `dark` = on cream/white surfaces.
  const onDark = variant === "light";
  const height = 36;

  const content = withWordmark ? (
    <Image
      src={onDark ? "/brand/logo-horizontal-white.png" : "/brand/logo-horizontal.png"}
      alt="Market Food"
      width={Math.round(height * RATIO)}
      height={height}
      priority
      className="h-9 w-auto"
    />
  ) : (
    <Image
      src={onDark ? "/brand/logo-icon-white.png" : "/brand/logo-icon.png"}
      alt="Market Food"
      width={height}
      height={height}
      priority
      className="h-9 w-9"
    />
  );

  // `data-no-translate` stops the runtime translation pass (see AutoTranslate) from turning
  // the brand into a common noun - "Market Food" is a name in every language.
  if (!href) {
    return (
      <span data-no-translate className={`gm-ltr flex items-center ${className}`}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      data-no-translate
      aria-label="Market Food - accueil"
      className={`gm-ltr flex items-center ${className}`}
    >
      {content}
    </Link>
  );
};

export default BrandMark;
