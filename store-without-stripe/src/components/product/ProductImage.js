import { useEffect, useMemo, useState } from "react";

import { glyphFor } from "@components/product/ProductGlyph";

/**
 * The one way a product is pictured, everywhere.
 *
 * Before this, three different things rendered a product: a `next/image` with `fill` and a
 * stray `p-2`, a raw `<img>`, and a Cloudinary placeholder URL from the original template that
 * 404s and leaves a broken-image glyph. Real photos sat on white while missing ones sat on
 * cream, so a grid of products looked like a grid from three different shops.
 *
 * Two decisions make it read as a catalogue rather than a page of uploads:
 *
 *  - **One tile, one ground.** Every product occupies the same square, with the image
 *    contained and evenly inset. Contained rather than cropped because a sack, a drum and a
 *    carton are different shapes, and cropping a 25kg sack to a square cuts the label off —
 *    the part the buyer identifies it by.
 *  - **A product without a photo is still drawn.** It gets an illustration of what it actually
 *    is — a sack, a jerrycan, a tin — in the colour family of its type, with its unit named
 *    underneath. Photographing a wholesale catalogue takes weeks, and until that is done a
 *    buyer can still tell a sack of flour from a drum of oil while scanning the grid. A real
 *    uploaded photo always wins over the drawing.
 */

/**
 * A colour family per kind of product, so the grid groups visually: every oil reads the same,
 * every sack reads the same. `body` is the soft fill of the drawing, `line` its outline.
 */
const TINTS = {
  oil: {
    bg: "bg-amber-50", body: "#FDF0D5", line: "#B4842F",
    label: "text-amber-700/70", ring: "ring-amber-100",
  },
  grain: {
    bg: "bg-brass-50", body: "#F6ECD8", line: "#9A7434",
    label: "text-brass-600/80", ring: "ring-brass-100",
  },
  drink: {
    bg: "bg-sky-50", body: "#E3F1FA", line: "#3E7A9C",
    label: "text-sky-700/70", ring: "ring-sky-100",
  },
  coffee: {
    bg: "bg-stone-100", body: "#EDE6DE", line: "#7A5C43",
    label: "text-stone-600/80", ring: "ring-stone-200",
  },
  preserve: {
    bg: "bg-rose-50", body: "#F7E6E4", line: "#A65B52",
    label: "text-rose-700/70", ring: "ring-rose-100",
  },
  produce: {
    bg: "bg-emerald-50", body: "#E2F0E5", line: "#3F7355",
    label: "text-emerald-700/75", ring: "ring-emerald-100",
  },
  hygiene: {
    bg: "bg-teal-50", body: "#DFF0EE", line: "#3C7D77",
    label: "text-teal-700/70", ring: "ring-teal-100",
  },
  default: {
    bg: "bg-sand", body: "#EFEAE0", line: "#7A7466",
    label: "text-ink-400", ring: "ring-line",
  },
};

const ProductImage = ({
  src,
  alt,
  unit,
  className = "",
  zoom = true,
  priority = false,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const name = alt || "";
  const { glyph: Glyph, tint } = useMemo(() => glyphFor(name, unit), [name, unit]);
  const palette = TINTS[tint] || TINTS.default;

  const showImage = src && !failed;

  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden ${
        showImage ? "bg-sand/50" : palette.bg
      } ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          loading={priority ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          className={`h-full w-full object-contain p-[8%] transition duration-500 ease-out ${
            zoom ? "group-hover:scale-[1.06]" : ""
          }`}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-[10%]">
          <div
            className={`min-h-0 w-full flex-1 transition duration-500 ease-out ${
              zoom ? "group-hover:scale-[1.06]" : ""
            }`}
          >
            <Glyph body={palette.body} line={palette.line} />
          </div>
          {unit && (
            <span
              data-no-translate
              className={`shrink-0 rounded-full bg-white/70 px-2.5 py-0.5 text-2xs font-medium uppercase tracking-luxe ring-1 ring-inset ${palette.ring} ${palette.label}`}
            >
              {unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImage;
