import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "react-use-cart";
import { IoAdd, IoCheckmark } from "react-icons/io5";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

//internal import
import useAddToCart from "@hooks/useAddToCart";
import ProductImage from "@components/product/ProductImage";
import useUtilsFunction from "@hooks/useUtilsFunction";
import useSuggestedProducts from "@hooks/useSuggestedProducts";

const SuggestionCard = ({ product, currency }) => {
  const { inCart } = useCart();
  const { handleAddItem } = useAddToCart();
  const { showingTranslateValue } = useUtilsFunction();

  const title = showingTranslateValue(product?.title);
  const price = Number(product?.prices?.price ?? 0);
  const added = inCart(product._id);

  /**
   * Goes through the shared hook like every other add: stock and minimum-order are checked,
   * and `image` is the single URL the cart line expects rather than the raw array. Silent and
   * without opening the drawer — this row is *inside* the drawer, and a toast per quick-add
   * would bury the cart it just changed.
   */
  const add = () => {
    if (added) return;
    handleAddItem(
      {
        _id: product._id,
        id: product._id,
        title,
        slug: product.slug,
        image: product.image?.[0] || "",
        unit: product.unit,
        price,
        prices: product.prices,
        stock: product.stock,
        minOrderQuantity: product.minOrderQuantity,
        priceTiers: product.priceTiers,
      },
      { silent: true, openDrawer: false }
    );
  };

  return (
    <div className="group flex w-40 shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-luxe transition hover:border-emerald-200 hover:shadow-luxe-lg">
      <Link
        href={product.slug ? `/product/${product.slug}` : "#"}
        className="block"
      >
        <ProductImage
          src={product.image?.[0]}
          alt={title}
          unit={product.unit}
          className="h-24"
        />
      </Link>
      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-2 min-h-[2.2rem] text-xs font-medium text-ink-700">
          {title}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold tabular-nums text-ink-900">
            {currency}
            {price.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={add}
            aria-label="Ajouter au panier"
            className={`grid h-8 w-8 place-items-center rounded-full transition ${
              added
                ? "bg-emerald-600 text-white"
                : "border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white"
            }`}
          >
            {added ? <IoCheckmark /> : <IoAdd />}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * A horizontal, quick-add cross-sell row. Renders nothing when there's nothing relevant to
 * suggest, so it's safe to drop into the cart drawer, checkout modal, etc.
 *
 * The row hides its scrollbar (`gm-rail`), which looks clean and, on its own, made the extra
 * products undiscoverable: in a narrow cart drawer there was nothing to say the row continued
 * and no scrollbar to drag. Two affordances fix that without adding clutter — a soft fade over
 * whichever edge still has content behind it, and arrows that appear only when the row
 * actually overflows and only on the side you can still travel towards.
 */
const ProductSuggestions = ({
  title = "Complétez votre commande",
  subtitle,
  limit = 8,
  // The surface this row sits on, so the edge fades blend into it instead of tinting it.
  // The cart drawer is cream; the checkout upsell modal is white.
  surface = "cream",
}) => {
  const { suggestions, isLoading } = useSuggestedProducts({ limit });
  const { currency } = useUtilsFunction();

  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // 4px tolerance: sub-pixel widths never land exactly on the boundary.
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync, suggestions.length]);

  const page = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild;
    // One card plus the 12px gap, so a card always lands flush against the edge.
    const step = card ? card.getBoundingClientRect().width + 12 : el.clientWidth;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  // Hooks first, then the early return, so their order never varies between renders.
  if (isLoading || suggestions.length === 0) return null;

  const arrowCls =
    "absolute top-[56px] z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink-600 shadow-luxe transition hover:border-emerald-300 hover:text-emerald-700";

  const fade =
    surface === "white"
      ? { left: "from-white", right: "from-white" }
      : { left: "from-cream", right: "from-cream" };

  return (
    <div>
      {title && (
        <div className="mb-3">
          <h3 className="font-display text-sm font-semibold text-ink-800">{title}</h3>
          {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
        </div>
      )}
      <div className="relative">
        <div
          ref={trackRef}
          className="gm-rail flex snap-x gap-3 overflow-x-auto pb-1"
        >
          {suggestions.map((p) => (
            <SuggestionCard key={p._id} product={p} currency={currency} />
          ))}
        </div>

        {/* Fades sit above the cards but must never eat a click meant for one. */}
        {!atStart && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r ${fade.left} to-transparent`}
          />
        )}
        {!atEnd && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l ${fade.right} to-transparent`}
          />
        )}

        {!atStart && (
          <button
            type="button"
            onClick={() => page(-1)}
            aria-label="Suggestions précédentes"
            className={`${arrowCls} left-1`}
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>
        )}
        {!atEnd && (
          <button
            type="button"
            onClick={() => page(1)}
            aria-label="Suggestions suivantes"
            className={`${arrowCls} right-1`}
          >
            <FiChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductSuggestions;
