import requests from "./httpService";
import { adaptLanguage } from "./adapters";

// ADMIN-only language configuration (backend /admin/languages). Storefront reads enabled
// languages from /languages.
const LanguageServices = {
  getAllLanguages: async () => {
    const res = await requests.get("/admin/languages");
    return (Array.isArray(res) ? res : res?.content ?? []).map(adaptLanguage);
  },

  getShowingLanguage: async () => {
    const res = await requests.get("/languages");
    return (Array.isArray(res) ? res : res?.content ?? []).map(adaptLanguage);
  },

  addLanguage: async (body) => requests.post("/admin/languages", body),

  updateLanguage: async (id, body) => requests.put(`/admin/languages/${id}`, body),

  deleteLanguage: async (id) => requests.delete(`/admin/languages/${id}`),

  updateStatus: async (id, body) => {
    const list = await requests.get("/admin/languages");
    const current = (Array.isArray(list) ? list : list?.content ?? []).find((l) => l.id === id);
    if (!current) return {};
    return requests.put(`/admin/languages/${id}`, {
      ...current,
      enabled: body?.status ? body.status === "show" : !current.enabled,
    });
  },
};

export default LanguageServices;
