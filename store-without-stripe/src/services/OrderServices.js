import requests from "./httpServices";
import { adaptOrder, adaptOrderSummary, pageContent } from "./adapters";

// Grossimarché orders. Checkout sends { addressId, paymentMethod, note, couponCode } with
// an Idempotency-Key header; the server recomputes every total. Returns OrderCreatedResponse
// { order, payment, pointsEarned }.
const OrderServices = {
  addOrder: async (body, config) => {
    return requests.post("/orders", body, config);
  },

  /**
   * One page of history plus the per-status counters.
   *
   * The counters come from `GET /orders/stats` (one grouped query server-side). They used to
   * be read off this response, which never contained them — so three of the four dashboard
   * cards were permanently zero. Fetched in parallel, and a failing stats call degrades to
   * zeros rather than taking the whole history down with it.
   */
  getOrderCustomer: async ({ page = 1, limit = 8 } = {}) => {
    // KachaBazar pages are 1-based; Grossimarché is 0-based + PageResponse-wrapped.
    const p = Math.max(0, Number(page) - 1);
    const [res, stats] = await Promise.all([
      requests.get(`/orders?page=${p}&size=${limit}`),
      requests.get("/orders/stats").catch(() => null),
    ]);
    return {
      orders: pageContent(res).map(adaptOrderSummary),
      totalDoc: res?.totalElements ?? 0,
      limits: limit,
      pages: res?.totalPages ?? 1,
      pending: stats?.pending ?? 0,
      processing: stats?.inProgress ?? 0,
      delivered: stats?.delivered ?? 0,
      cancelled: stats?.cancelled ?? 0,
    };
  },

  getOrderById: async (id) => {
    return adaptOrder(await requests.get(`/orders/${id}`));
  },

  /** Cancel one's own order. The backend allows this only while the order is PENDING. */
  cancelOrder: async (id) => {
    return adaptOrder(await requests.post(`/orders/${id}/cancel`, {}));
  },
};

export default OrderServices;
