import requests from "./httpService";
import { adaptAdminProduct, slugify } from "./adapters";

// Map the Kachabazar product form payload (multilingual title, prices object, image array,
// category id) onto the Grossimarché ProductRequest. Concepts the backend has no room for
// (variants, sale price, tags, SKU/barcode) are simply dropped.
const toProductRequest = (body) => {
  const name =
    typeof body.title === "object"
      ? body.title?.en || Object.values(body.title || {})[0] || ""
      : body.title || body.name || "";
  const categoryId =
    body.category?._id || body.category || body?.categories?.[0]?._id || body?.categories?.[0] || null;
  return {
    categoryId,
    name,
    slug: body.slug || slugify(name),
    description:
      typeof body.description === "object"
        ? body.description?.en || Object.values(body.description || {})[0] || ""
        : body.description || "",
    // Sent through untouched: blank asks the server to translate on save, a value says "keep
    // this wording" - which is how a bad machine translation gets corrected for good.
    nameAr: body.nameAr || "",
    descriptionAr: body.descriptionAr || "",
    price: Number(body?.prices?.price ?? body.price ?? 0),
    unit: body.unit || "unité",
    stockQuantity: Number(body.stock ?? body.stockQuantity ?? 0),
    minOrderQuantity: Number(body.minOrderQuantity ?? 1),
    imageUrl: Array.isArray(body.image) ? body.image[0] || "" : body.image || "",
    active: body.status ? body.status === "show" : body.active !== false,
  };
};

const detailToRequest = (d, activeOverride) => ({
  categoryId: d.categoryId,
  name: d.name,
  nameAr: d.nameAr || "",
  slug: d.slug,
  description: d.description || "",
  descriptionAr: d.descriptionAr || "",
  price: Number(d.price ?? 0),
  unit: d.unit || "unité",
  stockQuantity: Number(d.stockQuantity ?? 0),
  minOrderQuantity: Number(d.minOrderQuantity ?? 1),
  imageUrl: d.imageUrl || "",
  active: activeOverride !== undefined ? activeOverride : d.active,
});

const ProductServices = {
  // `clientType` narrows the list to the products carrying a price for that segment. Left unset
  // for ordinary management, where every product has to stay reachable.
  getAllProducts: async ({ page, limit, category, title, clientType }) => {
    const params = new URLSearchParams();
    params.set("page", Math.max((Number(page) || 1) - 1, 0)); // UI is 1-based, API is 0-based
    params.set("size", limit || 20);
    if (category) params.set("categoryId", category);
    if (title) params.set("q", title);
    if (clientType) params.set("clientTypeId", clientType);
    const res = await requests.get(`/admin/products?${params.toString()}`);
    return {
      products: (res.content || []).map(adaptAdminProduct),
      totalDoc: res.totalElements ?? 0,
    };
  },

  getProductById: async (id) =>
    adaptAdminProduct(await requests.get(`/admin/products/${id}`)),

  addProduct: async (body) =>
    adaptAdminProduct(await requests.post("/admin/products", toProductRequest(body))),

  // Upload a product image (multipart). The backend stores it and sets product.imageUrl.
  uploadImage: async (id, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return requests.post(`/admin/products/${id}/image`, fd);
  },

  addAllProducts: async (body) => requests.post("/admin/products/import", body),

  updateProduct: async (id, body) =>
    adaptAdminProduct(await requests.put(`/admin/products/${id}`, toProductRequest(body))),

  updateStatus: async (id, body) => {
    const detail = await requests.get(`/admin/products/${id}`);
    const active = body?.status ? body.status === "show" : !detail.active;
    return requests.put(`/admin/products/${id}`, detailToRequest(detail, active));
  },

  deleteProduct: async (id) => requests.delete(`/admin/products/${id}`),

  deleteManyProducts: async (body) => {
    const ids = body?.ids || [];
    await Promise.all(ids.map((id) => requests.delete(`/admin/products/${id}`)));
    return { message: "Produits supprimés" };
  },

  updateManyProducts: async () => ({ message: "Bulk update is not supported." }),
};

export default ProductServices;
