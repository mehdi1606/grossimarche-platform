import requests from "./httpService";

/**
 * Delivery rounds: the cities served, their rate, and the districts inside them.
 *
 * These rates used to live in application.yml, so changing one meant a redeploy. They are data
 * now - fuel moves, a driver leaves, a round opens - and this is what edits them.
 *
 * A city is saved whole, districts included: the back-office edits a round as one thing, and a
 * half-applied save leaves a city missing the district a customer is waiting in.
 */
const DeliveryServices = {
  /** Every city, suspended ones included - the back-office has to be able to reopen them. */
  getAll: async () => requests.get("/admin/delivery-cities"),

  create: async (body) => requests.post("/admin/delivery-cities", body),

  update: async (id, body) => requests.put(`/admin/delivery-cities/${id}`, body),

  /** Stops delivery there. The city and the addresses in it survive. */
  deactivate: async (id) => requests.delete(`/admin/delivery-cities/${id}`),
};

export default DeliveryServices;
