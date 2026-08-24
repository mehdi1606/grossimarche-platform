import { useContext, useState } from "react";
import { useCart } from "react-use-cart";

import { notifyError, notifySuccess } from "@utils/toast";
import { SidebarContext } from "@context/SidebarContext";
import { basePriceOf, effectiveUnitPrice } from "@utils/pricing";

/**
 * Adding to the cart, with the three things the old version was missing: French copy, the
 * wholesale minimum-order rule, and a visible confirmation.
 *
 * `minOrderQuantity` comes from the catalogue and is the whole point of a *marché de gros* —
 * a reference sold by the carton of 12 cannot be ordered one at a time. It was being adapted
 * from the API and then never enforced anywhere.
 */
const useAddToCart = () => {
  const [item, setItem] = useState(1);
  const { addItem, items, updateItem, updateItemQuantity, removeItem } = useCart();
  const { openCartDrawer } = useContext(SidebarContext);

  /**
   * Re-price a line for its new quantity.
   *
   * Quantity discounts are a *price* change, not a separate total, so the line's own price is
   * rewritten rather than corrected later in the summary. react-use-cart derives itemTotal and
   * cartTotal from `price`, so doing it here makes every screen — drawer, checkout, badge —
   * agree with what the server will charge, with no second calculation to keep in step.
   */
  const repriceForQuantity = (line, quantity) => {
    if (!line?.priceTiers?.length) return;
    const base = basePriceOf(line);
    const next = effectiveUnitPrice(base, line.priceTiers, quantity);
    if (next !== Number(line.price)) {
      updateItem(line.id, { price: next, basePrice: base });
    }
  };

  const stockOf = (product) =>
    Number(
      product?.variants?.length > 0 ? product?.variant?.quantity : product?.stock
    ) || 0;

  const minOf = (product) => Math.max(1, Number(product?.minOrderQuantity) || 1);

  const titleOf = (product) =>
    typeof product?.title === "string" ? product.title : product?.title?.en || "Article";

  /**
   * Add `item` units, or top the line up to the minimum if the product has one. Returns
   * `true` when the cart changed, so callers can drive their own animation off it.
   */
  const handleAddItem = (product, { silent = false, openDrawer = true } = {}) => {
    const stock = stockOf(product);
    const min = minOf(product);
    const existing = items.find((i) => i.id === product.id);
    const already = existing?.quantity || 0;

    if (stock < 1) {
      notifyError("Article en rupture de stock.");
      return false;
    }

    // First add of a product with a minimum jumps straight to that minimum rather than
    // adding 1 and rejecting the order later at checkout.
    const wanted = already === 0 ? Math.max(item, min) : item;

    if (already + wanted > stock) {
      notifyError(
        already > 0
          ? `Stock insuffisant — il ne reste que ${stock} unité(s).`
          : `Stock insuffisant — ${stock} unité(s) disponible(s).`
      );
      return false;
    }

    if (min > stock) {
      notifyError(
        `Commande minimum de ${min} unité(s) — stock actuel insuffisant.`
      );
      return false;
    }

    // Keep the untouched list price on the line: it is the only safe input for re-pricing
    // (reading `price` back would compound the discount on every quantity change) and it is
    // what the struck-through "before" price is drawn from.
    const base = basePriceOf(product);
    const total = already + wanted;
    addItem(
      {
        ...product,
        basePrice: base,
        price: effectiveUnitPrice(base, product.priceTiers, total),
      },
      wanted
    );
    if (!silent) {
      notifySuccess(
        wanted > 1
          ? `${wanted} × ${titleOf(product)} ajoutés au panier`
          : `${titleOf(product)} ajouté au panier`
      );
    }
    if (openDrawer) openCartDrawer();
    return true;
  };

  const handleIncreaseQuantity = (product) => {
    const result = items?.find((p) => p.id === product.id);
    if (!result) return false;

    if (result.quantity + item > stockOf(product)) {
      notifyError(`Stock insuffisant — maximum ${stockOf(product)} unité(s).`);
      return false;
    }
    const next = result.quantity + item;
    repriceForQuantity(result, next);
    updateItemQuantity(product.id, next);
    return true;
  };

  /**
   * Decrease by one, but never below the product's minimum: stepping under it removes the
   * line entirely, which is the only other honest outcome.
   */
  const handleDecreaseQuantity = (product) => {
    const result = items?.find((p) => p.id === product.id);
    if (!result) return false;

    const min = minOf(result);
    const next = result.quantity - 1;
    if (next < min) {
      removeItem(result.id);
      if (min > 1) {
        notifySuccess(`Retiré du panier — commande minimum de ${min} unité(s).`);
      }
      return true;
    }
    repriceForQuantity(result, next);
    updateItemQuantity(result.id, next);
    return true;
  };

  /** Set an exact quantity (typed by the shopper), clamped to [min, stock]. */
  const handleSetQuantity = (product, quantity) => {
    const line = items?.find((p) => p.id === product.id);
    if (!line) return false;

    const min = minOf(line);
    const stock = stockOf(line);
    const parsed = Number(quantity);

    if (!Number.isFinite(parsed) || parsed < min) {
      repriceForQuantity(line, min);
      updateItemQuantity(line.id, min);
      return false;
    }
    if (parsed > stock) {
      notifyError(`Stock insuffisant — maximum ${stock} unité(s).`);
      repriceForQuantity(line, stock);
      updateItemQuantity(line.id, stock);
      return false;
    }
    repriceForQuantity(line, parsed);
    updateItemQuantity(line.id, parsed);
    return true;
  };

  return {
    setItem,
    item,
    handleAddItem,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleSetQuantity,
    repriceForQuantity,
    minOf,
  };
};

export default useAddToCart;
