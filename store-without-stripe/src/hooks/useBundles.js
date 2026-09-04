import { useContext, useState } from "react";
import { useCart } from "react-use-cart";
import { useQuery } from "@tanstack/react-query";

import BundleServices from "@services/BundleServices";
import ProductServices from "@services/ProductServices";
import useCanSeeOffers from "@hooks/useCanSeeOffers";
import { SidebarContext } from "@context/SidebarContext";
import { notifyError, notifySuccess } from "@utils/toast";
import { bundleSavingsForCart } from "@utils/bundleSavings";

/**
 * Bundle offers on the storefront.
 *
 * Adding an offer puts its component products in the cart - the offer itself is never a cart
 * line. That is not a shortcut: the backend applies the saving to any cart that happens to
 * contain the full set, so assembling the basket by hand earns exactly the same price as
 * clicking the offer. One rule, one place, and the cart stays a plain list of products that
 * stock, tiers and coupons already understand.
 */
const useBundles = ({ productId = null, enabled = true } = {}) => {
  const { addItem, items } = useCart();
  const { openCartDrawer } = useContext(SidebarContext);
  const [addingId, setAddingId] = useState(null);
  /*
   * The gate lives here rather than at each call site.
   *
   * Without a trade the API returns every basket with no price, so the rail on the home page,
   * the offers page and the product page would each render a set of baskets showing nothing.
   * Refusing the request once means none of them has to remember to check - and it saves a
   * request that could only ever come back empty of the one thing it is asked for.
   */
  const canSeeOffers = useCanSeeOffers();

  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ["bundles", productId || "all"],
    queryFn: async () =>
      productId
        ? BundleServices.getBundlesForProduct(productId)
        : BundleServices.getShowingBundles(),
    enabled: enabled && canSeeOffers,
    staleTime: 5 * 60 * 1000,
  });

  /** What the current cart has already earned from offers (display only - see the util). */
  const savings = bundleSavingsForCart(bundles, items);

  const addBundleToCart = async (bundle) => {
    if (!bundle?.items?.length) return;
    if (!bundle.available) {
      notifyError("Cette offre n'est pas disponible pour le moment.");
      return;
    }
    setAddingId(bundle.id);
    try {
      // Re-read each product so the cart line carries live price, stock and unit - the offer
      // payload is a snapshot for display, and a cart built from it could drift.
      const products = await Promise.all(
        bundle.items.map((item) =>
          ProductServices.getProductById(item.productId).catch(() => null)
        )
      );

      const unavailable = [];
      let added = 0;

      products.forEach((product, i) => {
        const item = bundle.items[i];
        if (!product || product.status === "hide" || product.stock < item.quantity) {
          unavailable.push(item.name);
          return;
        }
        addItem(
          {
            _id: product._id,
            id: product._id,
            title: product.title?.fr || product.title?.en || item.name,
            slug: product.slug,
            image: product.image?.[0] || item.imageUrl || "",
            price: product.prices.price,
            originalPrice: product.prices.originalPrice,
            unit: product.unit,
            stock: product.stock,
            minOrderQuantity: product.minOrderQuantity,
            priceTiers: product.priceTiers,
          },
          item.quantity
        );
        added += 1;
      });

      if (added === 0) {
        notifyError("Aucun article de cette offre n'est disponible actuellement.");
        return;
      }
      if (unavailable.length > 0) {
        notifyError(`Article(s) indisponible(s) : ${unavailable.join(", ")}.`);
      } else {
        notifySuccess(`« ${bundle.name} » ajouté à votre panier.`);
      }
      openCartDrawer();
    } catch (err) {
      notifyError(err?.response?.data?.message || "Impossible d'ajouter cette offre.");
    } finally {
      setAddingId(null);
    }
  };

  return { bundles, isLoading, addBundleToCart, addingId, savings, canSeeOffers };
};

export default useBundles;
