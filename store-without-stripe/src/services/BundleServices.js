import requests from "./httpServices";

/**
 * Bundle offers ("paniers") — a named set of products sold together below the sum of its
 * parts. The API returns them already priced (componentsTotal / savings / savingsPercent are
 * computed server-side from live product prices), so nothing here recomputes money.
 */
const BundleServices = {
  /** Every offer orderable right now. */
  getShowingBundles: async () => {
    const res = await requests.get("/bundles");
    return Array.isArray(res) ? res : [];
  },

  /** Offers that include a given product — shown on that product's page. */
  getBundlesForProduct: async (productId) => {
    if (!productId) return [];
    const res = await requests.get(`/bundles?productId=${productId}`);
    return Array.isArray(res) ? res : [];
  },

  getBundleBySlug: async (slug) => requests.get(`/bundles/${slug}`),
};

export default BundleServices;
