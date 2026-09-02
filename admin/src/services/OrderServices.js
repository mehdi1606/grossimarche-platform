import requests from "./httpService";
import { adaptOrder, pageContent } from "./adapters";

// Map the admin's KachaBazar status labels back to Grossimarché OrderStatus.
const STATUS_TO_GM = {
  Pending: "PENDING",
  Processing: "PREPARING",
  "Out for Delivery": "OUT_FOR_DELIVERY",
  Delivered: "DELIVERED",
  Cancel: "CANCELLED",
  Cancelled: "CANCELLED",
};

const listOrders = async (page = 1, limit = 8) => {
  const p = Math.max(0, Number(page) - 1);
  const res = await requests.get(`/admin/orders?page=${p}&size=${limit}`);
  return {
    orders: pageContent(res).map(adaptOrder),
    totalDoc: res?.totalElements ?? 0,
    limits: limit,
    pages: res?.totalPages ?? 1,
  };
};

const OrderServices = {
  getAllOrders: async ({ page = 1, limit = 8 } = {}) => listOrders(page, limit),
  getAllOrdersTwo: async () => listOrders(1, 100),
  getRecentOrders: async ({ page = 1, limit = 8 } = {}) => listOrders(page, limit),

  getOrderById: async (id) => adaptOrder(await requests.get(`/admin/orders/${id}`)),

  updateOrder: async (id, body) => {
    const status = STATUS_TO_GM[body?.status] || body?.status;
    if (status === "CANCELLED") {
      return requests.post(`/admin/orders/${id}/cancel`, {});
    }
    return requests.patch(`/admin/orders/${id}/status`, { status, note: body?.note || "" });
  },

  // Dashboard analytics (shapes differ from KachaBazar - components may need alignment).
  getDashboardAmount: async () => requests.get("/admin/dashboard/summary"),
  getDashboardCount: async () => requests.get("/admin/dashboard/summary"),
  getDashboardRecentOrder: async ({ limit = 8 } = {}) => {
    const orders = await requests.get(`/admin/dashboard/recent-orders?limit=${limit}`);
    return { orders: (orders || []).map(adaptOrder) };
  },
  getDashboardOrdersData: async () => requests.get("/admin/dashboard/summary"),
  getBestSellerProductChart: async () => requests.get("/admin/dashboard/best-sellers?limit=6"),
  getDashboardSales: async (days = 30) => requests.get(`/admin/dashboard/sales?days=${days}`),
  // Dashboard breakdowns: deliveries per city (pie) and customers per trade segment (bar).
  getDeliveriesByCity: async () =>
    requests.get("/admin/dashboard/deliveries-by-city?limit=8"),
  getCustomersByType: async () => requests.get("/admin/dashboard/customers-by-type"),
};

export default OrderServices;
