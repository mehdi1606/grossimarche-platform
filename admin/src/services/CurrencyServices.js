import requests from "./httpService";
import { adaptCurrency } from "./adapters";

// ADMIN-only currency configuration (backend /admin/currencies). The public storefront reads
// enabled currencies from /currencies.
const CurrencyServices = {
  getAllCurrency: async () => {
    const res = await requests.get("/admin/currencies");
    return (Array.isArray(res) ? res : res?.content ?? []).map(adaptCurrency);
  },

  getShowingCurrency: async () => {
    const res = await requests.get("/currencies");
    return (Array.isArray(res) ? res : res?.content ?? []).map(adaptCurrency);
  },

  addCurrency: async (body) => requests.post("/admin/currencies", body),

  updateCurrency: async (id, body) => requests.put(`/admin/currencies/${id}`, body),

  deleteCurrency: async (id) => requests.delete(`/admin/currencies/${id}`),

  // Toggle helpers used by the shared ShowHideButton (fetch current, flip, PUT).
  updateEnabledStatus: async (id, body) => {
    const list = await requests.get("/admin/currencies");
    const current = (Array.isArray(list) ? list : list?.content ?? []).find((c) => c.id === id);
    if (!current) return {};
    return requests.put(`/admin/currencies/${id}`, {
      ...current,
      enabled: body?.status ? body.status === "show" : !current.enabled,
    });
  },
};

export default CurrencyServices;
