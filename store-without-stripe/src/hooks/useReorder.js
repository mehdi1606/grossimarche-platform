import { useContext, useState } from "react";
import { useCart } from "react-use-cart";

import { notifyError, notifySuccess } from "@utils/toast";
import OrderServices from "@services/OrderServices";
import ProductServices from "@services/ProductServices";
import { SidebarContext } from "@context/SidebarContext";

/**
 * "Commander à nouveau" - rebuild a past order as a fresh cart.
 *
 * A wholesale customer buys the same basket again and again; making them re-find twenty
 * references is the friction that sends them back to the phone. Deliberately *not* a
 * one-click repurchase: it fills the cart and opens the drawer so prices and stock can be
 * reviewed before committing.
 *
 * Products are re-priced from the catalogue, never from the old order line - a stale price
 * would be rejected by the server at checkout anyway. Items that have since been delisted or
 * gone out of stock are skipped and reported, rather than silently dropped.
 */
const useReorder = () => {
  const { addItem, emptyCart } = useCart();
  const { openCartDrawer } = useContext(SidebarContext);
  const [reorderingId, setReorderingId] = useState(null);

  const reorder = async (orderId, { replace = true } = {}) => {
    setReorderingId(orderId);
    try {
      const order = await OrderServices.getOrderById(orderId);
      const lines = order?.cart || [];
      if (lines.length === 0) {
        notifyError("Cette commande ne contient aucun article.");
        return;
      }

      const products = await Promise.all(
        lines.map((line) =>
          ProductServices.getProductById(line.id).catch(() => null)
        )
      );

      if (replace) emptyCart();

      const unavailable = [];
      let added = 0;

      products.forEach((product, i) => {
        const line = lines[i];
        if (!product || product.status === "hide") {
          unavailable.push(line.title);
          return;
        }
        if (Number(product.stock) < 1) {
          unavailable.push(product.title?.en || line.title);
          return;
        }
        // Never order more than is on the shelf today.
        const quantity = Math.min(Number(line.quantity) || 1, Number(product.stock));
        addItem(
          {
            _id: product._id,
            id: product._id,
            title: product.title?.en || line.title,
            slug: product.slug,
            image: product.image?.[0] || "",
            price: product.prices.price,
            originalPrice: product.prices.originalPrice,
            unit: product.unit,
            stock: product.stock,
            minOrderQuantity: product.minOrderQuantity,
            priceTiers: product.priceTiers,
          },
          quantity
        );
        added += 1;
      });

      if (added === 0) {
        notifyError("Aucun article de cette commande n'est disponible actuellement.");
        return;
      }

      if (unavailable.length > 0) {
        notifySuccess(
          `${added} article(s) ajoutés. Indisponibles : ${unavailable.join(", ")}.`
        );
      } else {
        notifySuccess("Votre panier a été rempli avec cette commande.");
      }
      openCartDrawer();
    } catch (err) {
      notifyError(
        err?.response?.data?.message || "Impossible de recréer cette commande."
      );
    } finally {
      setReorderingId(null);
    }
  };

  return { reorder, reorderingId };
};

export default useReorder;
