// Adapters: Grossimarché API shapes -> the shapes the KachaBazar admin components consume.

/** Grossimarché PageResponse (or a bare array) -> content array. */
export const pageContent = (res) => {
  if (Array.isArray(res)) return res;
  return res?.content ?? [];
};

const ROLE_LABEL = { ADMIN: "Admin", STORE_MANAGER: "Store Manager", CLIENT: "Client" };
const STATUS_LABEL = { ACTIVE: "Active", BLOCKED: "Inactive", DELETED: "Deleted" };

/** Grossimarché StaffResponse -> admin staff row. */
export const adaptStaff = (g) => ({
  _id: g.id,
  name: { en: g.fullName || "—" },
  email: g.email || "",
  phone: g.phone || "",
  role: ROLE_LABEL[g.role] || g.role,
  status: STATUS_LABEL[g.status] || g.status,
  createdAt: g.createdAt,
  lastLoginAt: g.lastLoginAt,
});

/** Grossimarché CustomerSummary/Detail -> admin customer row. */
export const adaptCustomer = (g) => ({
  _id: g.id,
  name: g.fullName || "—",
  email: g.email || "",
  phone: g.phone || "",
  status: STATUS_LABEL[g.status] || g.status,
  orderCount: g.orderCount ?? 0,
  totalSpent: g.totalSpent ?? 0,
  createdAt: g.createdAt,
});

const ORDER_STATUS_LABEL = {
  PENDING: "Pending",
  CONFIRMED: "Processing",
  PREPARING: "Processing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancel",
};

/** Grossimarché OrderSummary/Detail -> admin order row. */
export const adaptOrder = (g) => ({
  _id: g.id,
  invoice: g.orderNumber,
  createdAt: g.createdAt,
  status: ORDER_STATUS_LABEL[g.status] || g.status,
  rawStatus: g.status,
  paymentMethod: g.paymentMethod === "COD" ? "Cash" : g.paymentMethod,
  paymentStatus: g.paymentStatus,
  subTotal: g.subtotal,
  shippingCost: g.deliveryFee,
  discount: Number(g.discountTotal || 0) + Number(g.couponDiscount || 0),
  couponCode: g.couponCode,
  total: g.total,
  user_info: g.deliveryAddress
    ? {
        name: g.deliveryAddress.label || "Client",
        address: g.deliveryAddress.addressLine || "",
        city: g.deliveryAddress.city || "",
      }
    : {},
  cart: (g.items || []).map((it) => ({
    id: it.productId,
    title: it.productNameSnapshot,
    quantity: it.quantity,
    price: it.unitPrice,
    itemTotal: it.lineTotal,
  })),
});

/** Grossimarché AdminCouponResponse -> admin coupon row. */
export const adaptCoupon = (g) => ({
  _id: g.id,
  couponCode: g.code,
  title: { en: g.code },
  discountType: { type: g.type === "PERCENTAGE" ? "percentage" : "fixed", value: g.value },
  minimumAmount: g.minOrderSubtotal,
  productType: "All",
  logo: "",
  endTime: g.expiresAt,
  startTime: g.startsAt,
  status: g.active ? "show" : "hide",
  usageCount: g.usageCount,
});

/** Grossimarché product summary/detail -> admin product row (multilingual title). */
export const adaptProduct = (g) => {
  const price = Number(g.price ?? 0);
  const stock = g.stockQuantity !== undefined ? g.stockQuantity : g.inStock ? 100 : 0;
  return {
    _id: g.id,
    title: { en: g.name },
    slug: g.slug,
    description: { en: g.description || "" },
    prices: { price, originalPrice: price },
    image: g.imageUrl ? [g.imageUrl] : [],
    stock,
    status: g.active === false ? "hide" : "show",
    category: g.categoryId ? { _id: g.categoryId, name: { en: g.categoryName } } : null,
    categories: g.categoryId ? [{ _id: g.categoryId, name: { en: g.categoryName } }] : [],
    attributes: g.attributes ?? [],
  };
};

/** Grossimarché category -> admin category row. */
export const adaptCategory = (g) => ({
  _id: g.id,
  name: { en: g.name },
  slug: g.slug,
  icon: g.icon || "",
  status: g.active === false ? "hide" : "show",
  children: [],
});
