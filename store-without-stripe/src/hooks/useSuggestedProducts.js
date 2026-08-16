import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "react-use-cart";

//internal import
import ProductServices from "@services/ProductServices";

/**
 * Cross-sell engine: suggests products related to what's already in the cart. It picks the
 * category most represented in the cart (so suggestions feel relevant), fetches that
 * category, drops anything already in the cart, and caps the list. Falls back to the general
 * catalogue when the cart is empty or category-less.
 */
const useSuggestedProducts = ({ limit = 8, enabled = true } = {}) => {
  const { items } = useCart();

  const categoryId = useMemo(() => {
    const counts = {};
    items.forEach((it) => {
      const c = it.category?._id;
      if (c) counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  }, [items]);

  const inCart = useMemo(
    () => new Set(items.map((it) => it.id || it._id)),
    [items]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["suggestions", categoryId],
    queryFn: async () => await ProductServices.getRelatedProducts(categoryId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const suggestions = useMemo(
    () => (data || []).filter((p) => p?._id && !inCart.has(p._id)).slice(0, limit),
    [data, inCart, limit]
  );

  return { suggestions, isLoading };
};

export default useSuggestedProducts;
