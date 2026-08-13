import requests from "./httpServices";
import { adaptOrder, adaptOrderSummary, pageContent } from "./adapters";

// Grossimarché orders. Checkout sends { addressId, paymentMethod, note, couponCode } with
// an Idempotency-Key header; the server recomputes every total. Returns OrderCreatedResponse
// { order, payment, pointsEarned }.
const OrderServices = {
  addOrder: async (body, config) => {
    return requests.post("/orders", body, config);
  },

  getOrderCustomer: async ({ page = 1, limit = 8 } = {}) => {
    // KachaBazar pages are 1-based; Grossimarché is 0-based + PageResponse-wrapped.
    const p = Math.max(0, Number(page) - 1);
    const res = await requests.get(`/orders?page=${p}&size=${limit}`);
    return {
      orders: pageContent(res).map(adaptOrderSummary),
      totalDoc: res?.totalElements ?? 0,
      limits: limit,
      pages: res?.totalPages ?? 1,
    };
  },

  getOrderById: async (id) => {
    return adaptOrder(await requests.get(`/orders/${id}`));
  },
};

export default OrderServices;
