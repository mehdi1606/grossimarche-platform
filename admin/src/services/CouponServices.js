import requests from "./httpService";
import { adaptCoupon, pageContent } from "./adapters";

// KachaBazar coupon form -> Grossimarché AdminCouponRequest.
const toGmCoupon = (body) => ({
  code: (body.couponCode || body.code || "").toUpperCase(),
  type: body?.discountType?.type === "fixed" ? "FIXED" : "PERCENTAGE",
  value: Number(body?.discountType?.value ?? body?.value ?? 0),
  minOrderSubtotal: Number(body?.minimumAmount ?? 0),
  maxDiscount: body?.maxDiscount ? Number(body.maxDiscount) : null,
  startsAt: body?.startTime || null,
  expiresAt: body?.endTime || null,
  usageLimit: body?.usageLimit ? Number(body.usageLimit) : null,
  perUserLimit: Number(body?.perUserLimit ?? 1),
  active: body?.status !== "hide",
});

const CouponServices = {
  getAllCoupons: async () => {
    const res = await requests.get("/admin/coupons?size=100");
    return { coupons: pageContent(res).map(adaptCoupon) };
  },
  addCoupon: async (body) => requests.post("/admin/coupons", toGmCoupon(body)),
  addAllCoupon: async () => ({}), // bulk import not supported
  getCouponById: async () => ({}),
  updateCoupon: async (id, body) => requests.put(`/admin/coupons/${id}`, toGmCoupon(body)),
  updateStatus: async (id, body) =>
    requests.put(`/admin/coupons/${id}`, toGmCoupon({ ...body, status: body?.status })),
  deleteCoupon: async (id) => requests.delete(`/admin/coupons/${id}`),
  updateManyCoupons: async () => ({}),
  deleteManyCoupons: async () => ({}),
};

export default CouponServices;
