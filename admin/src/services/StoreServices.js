import requests from "./httpService";
import { adaptStore } from "./adapters";

// Physical stores / magasins (backend: public GET /stores, ADMIN writes /admin/stores). This
// is what the admin "Settings" panel manages.
const StoreServices = {
  getAllStores: async () => {
    const res = await requests.get("/stores");
    return (Array.isArray(res) ? res : res?.content ?? []).map(adaptStore);
  },

  addStore: async (body) => requests.post("/admin/stores", body),

  updateStore: async (id, body) => requests.put(`/admin/stores/${id}`, body),

  deleteStore: async (id) => requests.delete(`/admin/stores/${id}`),
};

export default StoreServices;
