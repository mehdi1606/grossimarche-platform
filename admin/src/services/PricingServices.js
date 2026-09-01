import requests from "./httpService";

/**
 * Per-client-type price grids.
 *
 * The grid is always read and written whole. A price ladder only makes sense read together,
 * and a half-applied edit is how a product ends up costing more at ten units than at three.
 */
const PricingServices = {
  /** Every active segment, priced or not - an empty ladder is the answer, not a gap. */
  getProductGrid: async (productId) =>
    requests.get(`/admin/products/${productId}/price-grid`),

  /** Replace the whole grid. A segment omitted here no longer sells this product. */
  saveProductGrid: async (productId, grids) =>
    requests.put(`/admin/products/${productId}/price-grid`, { grids }),

  getBundleGrid: async (bundleId) =>
    requests.get(`/admin/bundles/${bundleId}/price-grid`),

  saveBundleGrid: async (bundleId, prices) =>
    requests.put(`/admin/bundles/${bundleId}/price-grid`, { prices }),
};

export default PricingServices;
