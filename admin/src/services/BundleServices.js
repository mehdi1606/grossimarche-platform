import requests from "./httpService";

/**
 * Bundle offers ("paniers"): a named set of products sold together below the sum of its parts.
 *
 * Prices are never computed here - the API returns componentsTotal, savings and savingsPercent
 * from live product prices, and recomputes the discount again at checkout. The back-office
 * only says what the set contains and what the whole thing costs.
 */
const BundleServices = {
  getAll: async ({ page = 1, limit = 50 } = {}) => {
    const params = new URLSearchParams();
    params.set("page", Math.max((Number(page) || 1) - 1, 0)); // UI is 1-based, API is 0-based
    params.set("size", limit);
    const res = await requests.get(`/admin/bundles?${params.toString()}`);
    return { bundles: res?.content || [], totalDoc: res?.totalElements ?? 0 };
  },

  getById: async (id) => requests.get(`/admin/bundles/${id}`),

  create: async (body) => requests.post("/admin/bundles", body),

  update: async (id, body) => requests.put(`/admin/bundles/${id}`, body),

  /**
   * Upload the offer's image (multipart). The backend stores it and sets bundle.imageUrl, so
   * the picture is served from our own storage at /files/ - same path product images take.
   */
  uploadImage: async (id, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return requests.post(`/admin/bundles/${id}/image`, fd);
  },

  /** E-mail the offer to every active customer. Never automatic - see AdminBundleController. */
  announce: async (id) => requests.post(`/admin/bundles/${id}/announce`, {}),

  remove: async (id) => requests.delete(`/admin/bundles/${id}`),
};

export default BundleServices;
