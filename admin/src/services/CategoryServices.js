import requests from "./httpService";
import { adaptCategory, slugify } from "./adapters";

// Grossimarché categories are flat (name, slug, icon, displayOrder, active). The Kachabazar
// forms send a richer, multilingual shape; map it down to the backend CategoryRequest here.
const toCategoryRequest = (body, existing) => {
  const name =
    typeof body.name === "object"
      ? body.name?.en || Object.values(body.name || {})[0] || ""
      : body.name || "";
  const icon = body.icon || existing?.icon || "";
  return {
    name,
    slug: body.slug || existing?.slug || slugify(name),
    // The backend icon column is short (60 chars) - keep an icon name/emoji, not a long URL.
    icon: icon.length > 60 ? "" : icon,
    displayOrder: Number(body.displayOrder ?? existing?.displayOrder ?? 0),
    active: body.status ? body.status === "show" : body.active !== false,
  };
};

const CategoryServices = {
  // Admin listing returns every category (active + inactive).
  getAllCategory: async () => {
    const res = await requests.get("/admin/categories");
    return (Array.isArray(res) ? res : res?.content ?? []).map(adaptCategory);
  },

  getAllCategories: async () => {
    const res = await requests.get("/admin/categories");
    return (Array.isArray(res) ? res : res?.content ?? []).map(adaptCategory);
  },

  getCategoryById: async (id) => {
    const res = await requests.get("/admin/categories");
    const match = (Array.isArray(res) ? res : res?.content ?? [])
      .map(adaptCategory)
      .find((c) => c._id === id);
    // The submit hook reads name/description as language maps.
    return match
      ? { ...match, description: { en: "" }, parentId: undefined, parentName: "Home" }
      : {};
  },

  addCategory: async (body) =>
    requests.post("/admin/categories", toCategoryRequest(body)),

  addAllCategory: async (body) => requests.post("/admin/categories", body),

  updateCategory: async (id, body) => {
    const current = await CategoryServices.getCategoryById(id);
    return requests.put(`/admin/categories/${id}`, toCategoryRequest(body, current));
  },

  updateStatus: async (id, body) => {
    const current = await CategoryServices.getCategoryById(id);
    return requests.put(
      `/admin/categories/${id}`,
      toCategoryRequest({ ...current, status: body?.status }, current)
    );
  },

  deleteCategory: async (id) => requests.delete(`/admin/categories/${id}`),

  updateManyCategory: async () => ({ message: "Bulk update is not supported." }),

  deleteManyCategory: async (body) => {
    const ids = body?.ids || [];
    await Promise.all(ids.map((id) => requests.delete(`/admin/categories/${id}`)));
    return { message: "Catégories supprimées" };
  },
};

export default CategoryServices;
