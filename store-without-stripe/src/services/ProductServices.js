import requests from "./httpServices";
import { adaptProduct, adaptProducts, isUuid, pageContent } from "./adapters";

// Grossimarché catalogue: GET /products (search) and GET /products/{idOrSlug} (detail).
const searchProducts = async ({
  category = "",
  title = "",
  minPrice = "",
  maxPrice = "",
  inStock = false,
  size = 100,
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
  const res = await requests.get(`/products?${params.toString()}`);
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
  } = {}) => {
    if (slug) {
      const product = adaptProduct(await requests.get(`/products/${slug}`));
      const related = product?.category?._id
        ? await searchProducts({ category: product.category._id, size: 12 })
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

  // Same endpoint — it accepts an id or a slug. Named separately because reordering looks
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
