import requests from "./httpServices";

/**
 * Delivery zones, straight from the back-office.
 *
 * The storefront used to carry its own copy of the served cities in utils/delivery.js. That
 * list could only ever be a snapshot: a city added or re-priced in the admin did not reach the
 * shopper until someone edited the file. This is the same data the admin edits and the same
 * the server prices with.
 */
const DeliveryServices = {
  /** Active cities with their districts and rates. */
  getCities: async () => {
    const res = await requests.get("/delivery-cities");
    return Array.isArray(res) ? res : [];
  },
};

export default DeliveryServices;
