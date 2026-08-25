import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "react-use-cart";
import { FiPlus, FiMinus, FiTrash2 } from "react-icons/fi";

//internal import
import useAddToCart from "@hooks/useAddToCart";
import { SidebarContext } from "@context/SidebarContext";
import { basePriceOf, nextTier } from "@utils/pricing";

/**
 * One cart line.
 *
 * Three deliberate changes over the original: the quantity can be typed (not only stepped -
 * a wholesale order of 240 units is 239 clicks otherwise), removal is undoable, and the line
 * states what the shopper is actually buying - remaining stock and the next quantity break.
 *
 * Removal is committed immediately and the *undo* is owned by the cart (`onRemove`), not by
 * this component: a line that deferred its own deletion would quietly cancel it if the drawer
 * closed within the grace period, leaving an item the shopper believes they removed.
 */
const CartItem = ({ item, currency, compact = false, onRemove }) => {
  const { removeItem } = useCart();
  const { closeCartDrawer } = useContext(SidebarContext);
  const { handleIncreaseQuantity, handleDecreaseQuantity, handleSetQuantity, minOf } =
    useAddToCart();

  const [draft, setDraft] = useState(String(item.quantity));

  const min = minOf(item);
  const stock = Number(item.stock) || 0;
  const lowStock = stock > 0 && stock - item.quantity <= 3;

  // The line's `price` already carries any quantity discount (see useAddToCart); `basePrice`
  // is the list price it was struck down from.
  const base = basePriceOf(item);
  const discounted = Number(item.price) < base;
  const upcoming = nextTier(item.priceTiers, item.quantity);

  // Keep the input in step when the quantity changes from the stepper or elsewhere.
  useEffect(() => {
    setDraft(String(item.quantity));
  }, [item.quantity]);

  const remove = () => {
    if (onRemove) onRemove(item);
    else removeItem(item.id);
  };

  return (
    <div className="group relative flex w-full items-start gap-3 border-b border-line bg-white px-4 py-3.5 transition-colors last:border-b-0 hover:bg-cream">
      <Link
        href={`/product/${item.slug}`}
        onClick={closeCartDrawer}
        className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-sand"
      >
        {item.image ? (
          <img src={item.image} alt={item.title} className="h-full w-full object-contain p-1" />
        ) : (
          <span className="font-display text-lg text-emerald-600">G</span>
        )}
      </Link>

      <div className="flex w-full min-w-0 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/product/${item.slug}`}
            onClick={closeCartDrawer}
            className="line-clamp-2 text-sm font-medium text-ink-800 transition hover:text-emerald-700"
          >
            {item.title}
          </Link>
          <button
            onClick={remove}
            aria-label={`Retirer ${item.title}`}
            className="shrink-0 rounded-full p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-500"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>

        <span data-no-translate className="mt-0.5 flex items-center gap-1.5 text-xs">
          {discounted && (
            <span className="text-ink-300 line-through">
              {currency}
              {base.toFixed(2)}
            </span>
          )}
          <span className={discounted ? "font-semibold text-emerald-700" : "text-ink-400"}>
            {currency}
            {Number(item.price).toFixed(2)} / {item.unit || "unité"}
          </span>
        </span>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex h-8 items-center rounded-lg border border-line bg-white">
            <button
              onClick={() => handleDecreaseQuantity(item)}
              aria-label="Diminuer la quantité"
              className="grid h-full w-7 place-items-center text-ink-500 transition hover:text-emerald-700"
            >
              <FiMinus className="h-3.5 w-3.5" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={draft}
              aria-label="Quantité"
              onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => handleSetQuantity(item, draft)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="h-full w-10 border-x border-line bg-transparent p-0 text-center text-sm font-semibold tabular-nums text-ink-800 focus:border-line focus:outline-none focus:ring-0"
            />
            <button
              onClick={() => handleIncreaseQuantity(item)}
              aria-label="Augmenter la quantité"
              className="grid h-full w-7 place-items-center text-ink-500 transition hover:text-emerald-700"
            >
              <FiPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          <span data-no-translate className="text-sm font-semibold tabular-nums text-ink-900">
            {currency}
            {(item.price * item.quantity).toFixed(2)}
          </span>
        </div>

        {discounted && (
          <p className="mt-1 text-2xs font-medium text-emerald-700">
            Tarif dégressif appliqué
          </p>
        )}

        {!compact && (min > 1 || upcoming || lowStock) && (
          <div className="mt-1.5 space-y-0.5">
            {min > 1 && (
              <p className="text-2xs text-ink-400">Commande minimum : {min}</p>
            )}
            {upcoming && (
              <p className="text-2xs font-medium text-brass-600">
                Passez à {upcoming.minQuantity} → {currency}
                {Number(upcoming.unitPrice).toFixed(2)} / {item.unit || "unité"}
              </p>
            )}
            {lowStock && (
              <p className="text-2xs font-medium text-amber-600">
                Plus que {stock} en stock
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItem;
