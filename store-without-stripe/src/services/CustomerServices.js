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

  /**
   * Forgotten password, in three steps.
   *
   * The address is sent again at every step because the code is stored against it, not against
   * a session: someone reads the code on their phone and finishes on their computer, and that
   * has to work.
   *
   * `forgotPassword` resolves whether or not the address has an account - the API refuses to
   * say, so this cannot be used to find out who shops here.
   */
  forgotPassword: async (email) => {
    return requests.post("/auth/password/forgot", { email });
  },

  verifyResetCode: async ({ email, code }) => {
    return requests.post("/auth/password/verify-code", { email, code });
  },

  resetPassword: async ({ email, code, newPassword }) => {
    return requests.post("/auth/password/reset", { email, code, newPassword });
  },

  /**
   * Exchange a refresh token for a fresh access token.
   *
   * Called from the NextAuth jwt callback, on the server, so it deliberately does not go
   * through the shared axios defaults: there is no signed-in header there to send, and a
   * stale one would only confuse the request.
   */
  refreshToken: async (refreshToken) => {
    return requests.post("/auth/refresh", { refreshToken });
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

  // Editing and removing an address were reachable from the account page but had no service
  // behind them.
  updateShippingAddress: async (id, shippingAddressData) => {
    return requests.patch(`/me/addresses/${id}`, shippingAddressData);
  },

  deleteShippingAddress: async (id) => {
    return requests.delete(`/me/addresses/${id}`);
  },
};

export default CustomerServices;
