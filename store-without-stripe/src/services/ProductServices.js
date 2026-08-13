import requests from "./httpServices";
import { adaptProduct, adaptProducts, isUuid, pageContent } from "./adapters";

// Grossimarché catalogue: GET /products (search) and GET /products/{idOrSlug} (detail).
const searchProducts = async ({ category = "", title = "", size = 100 } = {}) => {
  const params = new URLSearchParams();
  if (category && isUuid(category)) params.set("categoryId", category);
  if (title) params.set("q", title);
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
  getShowingStoreProducts: async ({ category = "", title = "", slug = "" } = {}) => {
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
    const products = await searchProducts({ category, title, size: 100 });
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
};

export default ProductServices;
