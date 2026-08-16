import requests from "./httpServices";

// Grossimarché is passwordless: sign in by requesting a one-time code (SMS/EMAIL) then
// verifying it. Verify returns { accessToken, refreshToken, user } and, on first login,
// creates the account. NextAuth's credentials authorize() calls verifyOtp (see
// @lib/next-auth-options); the storefront login screen calls requestOtp then signIn.
const CustomerServices = {
  // channel: "SMS" | "EMAIL", destination: phone (E.164-ish) or email
  requestOtp: async ({ channel, destination }) => {
    return requests.post("/auth/otp/request", { channel, destination });
  },

  verifyOtp: async ({ channel, destination, code }) => {
    return requests.post("/auth/otp/verify", { channel, destination, code });
  },

  // Profile & addresses (mapped to /me — request/response field mapping refined in FE-4).
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
