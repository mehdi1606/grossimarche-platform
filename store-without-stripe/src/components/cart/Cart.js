import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import { useCart } from "react-use-cart";
import { IoBagHandle, IoClose, IoArrowForward } from "react-icons/io5";
import { FiLock, FiPackage, FiRotateCcw, FiTruck } from "react-icons/fi";

//internal import
import { getUserSession } from "@lib/auth";
import CartItem from "@components/cart/CartItem";
import { SidebarContext } from "@context/SidebarContext";
import useUtilsFunction from "@hooks/useUtilsFunction";
import ProductSuggestions from "@components/product/ProductSuggestions";
import { shippingEstimate, estimatedDeliveryLabel } from "@utils/delivery";
import useBundles from "@hooks/useBundles";

const Cart = () => {
  const router = useRouter();
  const { isEmpty, items, cartTotal, totalItems, addItem, removeItem } = useCart();
  const { closeCartDrawer } = useContext(SidebarContext);
  const { currency } = useUtilsFunction();
  const userInfo = getUserSession();

  /**
   * Undo for the last removed line. Removal is committed immediately - the cart is always
   * truthful - and the removed item is held here just long enough to put back. Deleting a
   * line was previously instant and irreversible, which is a harsh outcome for a mis-tap on
   * a 4mm icon.
   */
  const [lastRemoved, setLastRemoved] = useState(null);

  useEffect(() => {
    if (!lastRemoved) return undefined;
    const timer = setTimeout(() => setLastRemoved(null), 6000);
    return () => clearTimeout(timer);
  }, [lastRemoved]);

  const handleRemove = (item) => {
    removeItem(item.id);
    setLastRemoved(item);
  };

  const handleUndoRemove = () => {
    const { quantity, ...product } = lastRemoved;
    addItem(product, quantity);
    setLastRemoved(null);
  };

  // Bundle offers the cart has already earned. Display only - the server recomputes the
  // discount at checkout and is what the customer is actually charged.
  const { savings: bundleSavings } = useBundles();

  // The delivery quote comes from the same helper the checkout total uses, so the drawer can
  // show the real all-in cost instead of a sub-total that grows by 30 MAD one screen later.
  const shipping = shippingEstimate(cartTotal);
  const payable = Math.max(0, cartTotal - bundleSavings.total) + shipping.cost;

  const handleCheckout = () => {
    if (items?.length <= 0) {
      closeCartDrawer();
    } else if (!userInfo) {
      router.push(`/auth/login?redirectUrl=checkout`);
      closeCartDrawer();
    } else {
      router.push("/checkout");
      closeCartDrawer();
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-cream">
      {/* Header */}
      <div className="flex items-center justify-between bg-emerald-700 px-5 py-4 text-white">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold">
          <IoBagHandle className="text-xl" />
          Mon panier
          {totalItems > 0 && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium tabular-nums">
              {totalItems}
            </span>
          )}
        </h2>
        <button
          onClick={closeCartDrawer}
          aria-label="Fermer le panier"
          className="rounded-full p-1.5 transition hover:bg-white/15"
        >
          <IoClose className="text-xl" />
        </button>
      </div>

      {/* Undo strip - sits above the list so it is visible whatever is scrolled into view. */}
      {lastRemoved && (
        <div className="flex animate-fade-up items-center justify-between gap-3 border-b border-line bg-sand px-4 py-2.5">
          <p className="min-w-0 truncate text-sm text-ink-500">
            <span className="font-medium text-ink-700">{lastRemoved.title}</span> retiré
          </p>
          <button
            onClick={handleUndoRemove}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:border-emerald-300"
          >
            <FiRotateCcw className="h-3 w-3" />
            Annuler
          </button>
        </div>
      )}

      {/* Items */}
      <div className="w-full flex-grow overflow-y-auto scrollbar-hide">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-4xl text-emerald-500">
              <IoBagHandle />
            </span>
            <h3 className="pt-5 font-display text-lg font-semibold text-ink-800">
              Votre panier est vide
            </h3>
            <p className="pt-2 text-sm text-ink-500">
              Ajoutez des produits pour commencer votre commande.
            </p>
            <button
              onClick={closeCartDrawer}
              className="mt-6 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Continuer mes achats
            </button>
          </div>
        ) : (
          <>
            {items.map((item, i) => (
              <CartItem
                key={i + 1}
                item={item}
                currency={currency}
                onRemove={handleRemove}
              />
            ))}

            {/* Cross-sell: relevant add-ons based on what's in the cart */}
            <div className="border-t border-line bg-cream p-4">
              <ProductSuggestions
                title="Ajoutez aussi"
                subtitle="Souvent commandés ensemble"
                limit={8}
              />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {!isEmpty && (
        <div className="border-t border-line bg-white p-5 shadow-luxe-lg">
          {/* Free-shipping progress: the single most effective basket-size nudge, and the
              threshold now comes from the shared delivery rules rather than a local copy. */}
          {shipping.remaining > 0 ? (
            <div className="mb-3">
              <p className="mb-1.5 text-xs text-ink-600">
                Plus que{" "}
                <span className="font-semibold text-emerald-700">
                  {currency}
                  {shipping.remaining.toFixed(2)}
                </span>{" "}
                pour la <span className="font-semibold">livraison offerte</span>
              </p>
              <div className="h-1 w-full overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${shipping.progress}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mb-3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2 text-xs font-medium text-emerald-700">
              <FiTruck className="h-3.5 w-3.5" />
              Livraison offerte débloquée
            </p>
          )}

          {/* The whole cost, before the shopper commits to a checkout flow. */}
          <dl className="mb-3 space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-500">Sous-total</dt>
              <dd data-no-translate className="font-medium tabular-nums text-ink-800">
                {currency}
                {cartTotal.toFixed(2)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-500">Livraison estimée</dt>
              <dd className="font-medium tabular-nums text-ink-800">
                {shipping.qualifiesFree ? (
                  <span className="text-emerald-700">Offerte</span>
                ) : (
                  `${currency}${shipping.cost.toFixed(2)}`
                )}
              </dd>
            </div>
            {bundleSavings.total > 0 && (
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-brass-600">
                  <FiPackage className="h-3.5 w-3.5" />
                  {bundleSavings.applied.length > 1
                    ? `Offres paniers (${bundleSavings.applied.length})`
                    : `Offre « ${bundleSavings.applied[0].name} »`}
                </dt>
                <dd
                  data-no-translate
                  className="font-medium tabular-nums text-brass-600"
                >
                  −{currency}
                  {bundleSavings.total.toFixed(2)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-line pt-2">
              <dt className="font-display text-base font-semibold text-ink-900">Total</dt>
              <dd data-no-translate className="font-display text-xl font-semibold tabular-nums text-ink-900">
                {currency}
                {payable.toFixed(2)}
              </dd>
            </div>
          </dl>

          <p className="mb-3 text-2xs text-ink-400">
            Livraison estimée le{" "}
            <span className="font-medium text-ink-600">{estimatedDeliveryLabel()}</span> ·
            frais définitifs selon la ville choisie.
          </p>

          <button
            onClick={handleCheckout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-luxe transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            Passer la commande <IoArrowForward />
          </button>
          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-2xs text-ink-400">
            <FiLock className="h-3 w-3" />
            Paiement à la livraison - aucune carte requise
          </p>
        </div>
      )}
    </div>
  );
};

export default Cart;
