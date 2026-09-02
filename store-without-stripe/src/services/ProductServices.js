import requests from "./httpServices";
import { adaptProduct, adaptProducts, isUuid, pageContent } from "./adapters";
import { authHeader } from "@lib/server-token";

/**
 * Grossimarché catalogue: GET /products (search) and GET /products/{idOrSlug} (detail).
 *
 * Every read takes an optional `token`. In the browser the axios instance already carries the
 * signed-in customer's header, but server-rendered pages run where that default does not exist,
 * and the API resolves prices from whoever is asking - so an SSR call without it returns a
 * catalogue with no prices at all.
 */
const searchProducts = async ({
  category = "",
  title = "",
  minPrice = "",
  maxPrice = "",
  inStock = false,
  size = 100,
  token = null,
} = {}) => {
  const params = new URLSearchParams();
  if (category && isUuid(category)) params.set("categoryId", category);
  if (title) params.set("q", title);
  // The backend filters on price and availability itself, so the result count stays honest.
  if (minPrice !== "" && !Number.isNaN(Number(minPrice)))
    params.set("minPrice", String(minPrice));
  if (maxPrice !== "" && !Number.isNaN(Number(maxPrice)))
    params.set("maxPrice", String(maxPrice));
  if (inStock) params.set("inStock", "true");
  params.set("size", String(size));
  const res = await requests.get(`/products?${params.toString()}`, authHeader(token));
  return adaptProducts(pageContent(res));
};

const ProductServices = {
  getShowingProducts: async () => {
    const products = await searchProducts({ size: 100 });
    return { products };
  },

  // The store's pages read { products, popularProducts, discountedProducts, relatedProducts }.
  // Grossimarché has no "popular"/"discount" split, so the same live list feeds each.
  getShowingStoreProducts: async ({
    category = "",
    title = "",
    slug = "",
    minPrice = "",
    maxPrice = "",
    inStock = false,
    token = null,
  } = {}) => {
    if (slug) {
      const product = adaptProduct(
        await requests.get(`/products/${slug}`, authHeader(token))
      );
      const related = product?.category?._id
        ? await searchProducts({ category: product.category._id, size: 12, token })
        : [];
      return {
        products: product ? [product] : [],
        popularProducts: [],
        discountedProducts: [],
        relatedProducts: related,
      };
    }
    const products = await searchProducts({
      category,
      title,
      minPrice,
      maxPrice,
      inStock,
      size: 100,
      token,
    });
    return {
      products,
      popularProducts: products,
      discountedProducts: products,
      relatedProducts: products,
    };
  },

  getDiscountedProducts: async () => {
    const products = await searchProducts({ size: 100 });
    return { products };
  },

  getProductBySlug: async (slug) => {
    return adaptProduct(await requests.get(`/products/${slug}`));
  },

  // Same endpoint - it accepts an id or a slug. Named separately because reordering looks
  // products up by the id stored on the order line, and reads better saying so.
  getProductById: async (id) => {
    return adaptProduct(await requests.get(`/products/${id}`));
  },

  // Cross-sell / upsell suggestions: prefer the same category as what's in the cart, fall
  // back to the general catalogue when no category is known.
  getRelatedProducts: async (categoryId = "") => {
    return categoryId
      ? await searchProducts({ category: categoryId, size: 12 })
      : await searchProducts({ size: 12 });
  },
};

export default ProductServices;
