import requests from "./httpService";

/**
 * Client types: the commercial segments customers are grouped into (patisserie, epicerie,
 * laiterie, …).
 *
 * A segment is what selects a customer's price list, so this list is the backbone of the whole
 * pricing grid - not a cosmetic label. Creating one is ADMIN-only on the API.
 */
const ClientTypeServices = {
  /** Every segment, retired ones included: the back-office has to be able to revive them. */
  getAll: async () => requests.get("/admin/client-types"),

  getById: async (id) => requests.get(`/admin/client-types/${id}`),

  create: async (body) => requests.post("/admin/client-types", body),

  update: async (id, body) => requests.put(`/admin/client-types/${id}`, body),

  /**
   * Retire a segment. The row is kept and merely deactivated - customers belong to it and
   * products are priced against it, so a real delete would destroy live pricing.
   */
  deactivate: async (id) => requests.delete(`/admin/client-types/${id}`),
};

export default ClientTypeServices;
