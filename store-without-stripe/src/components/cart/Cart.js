import { useRouter } from "next/router";
import React, { useContext } from "react";
import { useCart } from "react-use-cart";
import { IoBagHandle, IoClose, IoArrowForward } from "react-icons/io5";

//internal import
import { getUserSession } from "@lib/auth";
import CartItem from "@components/cart/CartItem";
import { SidebarContext } from "@context/SidebarContext";
import useUtilsFunction from "@hooks/useUtilsFunction";
import ProductSuggestions from "@components/product/ProductSuggestions";

const Cart = () => {
  const router = useRouter();
  const { isEmpty, items, cartTotal, totalItems } = useCart();
  const { closeCartDrawer } = useContext(SidebarContext);
  const { currency } = useUtilsFunction();
  const userInfo = getUserSession();

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
    <div className="flex h-full w-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-4 text-white">
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
          <IoBagHandle className="text-xl" />
          Mon panier
          {totalItems > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
              {totalItems}
            </span>
          )}
        </h2>
        <button
          onClick={closeCartDrawer}
          aria-label="Fermer"
          className="rounded-full p-1.5 transition hover:bg-white/15"
        >
          <IoClose className="text-xl" />
        </button>
      </div>

      {/* Items */}
      <div className="w-full flex-grow overflow-y-auto scrollbar-hide">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-4xl text-emerald-500">
              <IoBagHandle />
            </span>
            <h3 className="pt-5 font-serif text-lg font-semibold text-gray-700">
              Votre panier est vide
            </h3>
            <p className="pt-2 text-sm text-gray-500">
              Ajoutez des produits pour commencer votre commande.
            </p>
            <button
              onClick={closeCartDrawer}
              className="mt-6 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600"
            >
              Continuer mes achats
            </button>
          </div>
        ) : (
          <>
            {items.map((item, i) => (
              <CartItem key={i + 1} item={item} currency={currency} />
            ))}

            {/* Cross-sell: relevant add-ons based on what's in the cart */}
            <div className="border-t border-gray-100 p-4">
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
        <div className="border-t border-gray-100 p-5">
          {/* Free-shipping progress nudge (threshold kept in step with checkout: 1000 MAD) */}
          {(() => {
            const THRESHOLD = 1000;
            const remaining = Math.max(0, THRESHOLD - cartTotal);
            return remaining > 0 ? (
              <div className="mb-3">
                <p className="mb-1.5 text-xs text-gray-600">
                  Plus que{" "}
                  <span className="font-semibold text-emerald-600">
                    {currency}
                    {remaining.toFixed(2)}
                  </span>{" "}
                  pour la <span className="font-semibold">livraison offerte</span> 🎉
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (cartTotal / THRESHOLD) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mb-3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2 text-xs font-medium text-emerald-700">
                🎉 Livraison offerte débloquée !
              </p>
            );
          })()}
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-gray-500">Sous-total</span>
            <span className="text-lg font-bold text-gray-800">
              {currency}
              {cartTotal.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleCheckout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            Passer la commande <IoArrowForward />
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
