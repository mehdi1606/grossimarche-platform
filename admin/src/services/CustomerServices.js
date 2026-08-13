import requests from "./httpService";
import { adaptCustomer, pageContent } from "./adapters";

const CustomerServices = {
  getAllCustomers: async ({ searchText = "" } = {}) => {
    const q = searchText ? `&q=${encodeURIComponent(searchText)}` : "";
    const res = await requests.get(`/admin/customers?size=100${q}`);
    return pageContent(res).map(adaptCustomer);
  },

  getCustomerById: async (id) => adaptCustomer(await requests.get(`/admin/customers/${id}`)),

  updateCustomer: async (id, body) =>
    requests.patch(`/admin/customers/${id}/status`, {
      status: body?.status === "Inactive" || body?.status === "BLOCKED" ? "BLOCKED" : "ACTIVE",
    }),

  // Not supported (accounts are created by OTP first-login; deletion is loi 09-08 erasure).
  addAllCustomers: async () => ({}),
  createCustomer: async () => ({}),
  filterCustomer: async () => ({}),
  deleteCustomer: async () => ({}),
};

export default CustomerServices;
