import requests from "./httpServices";

// Grossimarché validates a coupon against the caller's current (server) cart and returns a
// preview: { code, type, discountAmount, cartSubtotal, subtotalAfterDiscount, valid, message }.
// The cart must be synced to the server first (see CartServices.syncFromLocal).
const CouponServices = {
  validate: async ({ code }) => requests.post("/coupons/validate", { code }),

  // No public coupon showcase in Grossimarché.
  getAllCoupons: async () => [],
  getShowingCoupons: async () => [],
};

export default CouponServices;
