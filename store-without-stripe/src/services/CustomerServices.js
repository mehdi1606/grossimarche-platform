import requests from "./httpServices";

/**
 * Customer accounts.
 *
 * Grossimarche is a wholesaler, so an account is a trade relationship rather than a
 * self-service signup: registering creates a PENDING account that can sign in to nothing and
 * see no prices until the merchant recognises the business. That is deliberate - prices here
 * are per client type and confidential.
 *
 * Sign-in is e-mail + password. The one-time-code flow it replaced could not express any of
 * this: a code proves you own a phone number, not that you are a shop.
 */
const CustomerServices = {
  login: async ({ email, password }) => {
    return requests.post("/auth/login", { email, password });
  },

  /** Apply for a trade account. Returns the PENDING account; no tokens, by design. */
  register: async (body) => {
    return requests.post("/auth/register", body);
  },

  /** The segments offered at sign-up. Public: the chooser runs before anyone has an account. */
  getClientTypes: async () => {
    return requests.get("/client-types");
  },

  /**
   * The cities we deliver to, each with its districts.
   *
   * The sign-up form offers these instead of a free-text city, because an address typed by hand
   * is an address nobody can price: the delivery fee is resolved from exactly these names.
   */
  getDeliveryCities: async () => {
    return requests.get("/delivery-cities");
  },

  // Profile & addresses.
  getCustomer: async () => {
    return requests.get("/me");
  },

  updateCustomer: async (id, body) => {
    return requests.patch("/me", body);
  },

  getShippingAddress: async () => {
    return requests.get("/me/addresses");
  },

  addShippingAddress: async ({ shippingAddressData }) => {
    return requests.post("/me/addresses", shippingAddressData);
  },
};

export default CustomerServices;
