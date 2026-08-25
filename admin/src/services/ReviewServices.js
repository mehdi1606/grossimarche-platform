import requests from "./httpService";

/**
 * Product-review moderation.
 *
 * A submitted review starts unapproved and stays invisible in the storefront until someone
 * approves it here. The backend has had these endpoints all along; without a screen calling
 * them, every review a customer wrote was stuck pending forever - which looked, from the
 * shop side, exactly like reviews not working.
 */
const ReviewServices = {
  getAll: async ({ page = 1, limit = 50 } = {}) => {
    const params = new URLSearchParams();
    params.set("page", Math.max((Number(page) || 1) - 1, 0)); // UI is 1-based, API is 0-based
    params.set("size", limit);
    const res = await requests.get(`/admin/reviews?${params.toString()}`);
    return { reviews: res?.content || [], totalDoc: res?.totalElements ?? 0 };
  },

  approve: async (id) => requests.patch(`/admin/reviews/${id}/approve`, {}),

  remove: async (id) => requests.delete(`/admin/reviews/${id}`),
};

export default ReviewServices;
