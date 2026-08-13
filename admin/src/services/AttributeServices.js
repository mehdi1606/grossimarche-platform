import requests from "./httpService";
import { adaptAttribute } from "./adapters";

// Catalogue attributes (backend /admin/attributes). Open to STORE_MANAGER + ADMIN. The
// storefront reads enabled attributes from /attributes.
const toAttributeRequest = (body) => ({
  name:
    typeof body.name === "object"
      ? body.name?.en || Object.values(body.name || {})[0] || ""
      : body.title?.en || body.name || body.title || "",
  type: body.type || (body.option === "Checkbox" ? "CHECKBOX" : "OPTION"),
  enabled: body.status ? body.status === "show" : body.enabled !== false,
  values: (body.values || body.variants || []).map((v) => ({
    name: typeof v.name === "object" ? v.name?.en : v.name,
    enabled: v.status ? v.status === "show" : v.enabled !== false,
  })),
});

const AttributeServices = {
  getAllAttributes: async () => {
    const res = await requests.get("/admin/attributes");
    return (Array.isArray(res) ? res : res?.content ?? []).map(adaptAttribute);
  },

  // The product editor asks for the list of attributes to build filters.
  getShowingAttributes: async () => {
    const res = await requests.get("/attributes");
    return (Array.isArray(res) ? res : res?.content ?? []).map(adaptAttribute);
  },

  getAttributeById: async (id) =>
    adaptAttribute(await requests.get(`/admin/attributes/${id}`)),

  addAttribute: async (body) =>
    requests.post("/admin/attributes", toAttributeRequest(body)),

  updateAttribute: async (id, body) =>
    requests.put(`/admin/attributes/${id}`, toAttributeRequest(body)),

  deleteAttribute: async (id) => requests.delete(`/admin/attributes/${id}`),

  updateStatus: async (id, body) => {
    const current = await requests.get(`/admin/attributes/${id}`);
    return requests.put(`/admin/attributes/${id}`, {
      ...current,
      enabled: body?.status ? body.status === "show" : !current.enabled,
    });
  },
};

export default AttributeServices;
