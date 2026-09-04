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
  name: { en: g.fullName || "-" },
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
  name: g.fullName || "-",
  email: g.email || "",
  phone: g.phone || "",
  // Trade segment: it decides which price grid the customer is charged, so the list shows it.
  clientType: g.clientTypeName || "",
  status: STATUS_LABEL[g.status] || g.status,
  orderCount: g.orderCount ?? 0,
  totalSpent: g.totalSpent ?? 0,
  createdAt: g.createdAt,
  /**
   * The customer's last ten orders, present on the detail response only.
   *
   * Dropped here until now, which is why "voir un client" could only ever show six figures in
   * a dialog: the one thing worth knowing about a wholesale customer - what they actually buy,
   * and how often - was arriving from the API and being discarded on the way in.
   */
  recentOrders: (g.recentOrders || []).map(adaptOrder),
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
    title: it.productName,
    unit: it.unit,
    quantity: it.quantity,
    price: it.unitPrice,
    itemTotal: it.lineTotal,
  })),
  /**
   * What the shopper asked for at checkout, and every status this order has been through.
   *
   * Both were being dropped here. The API has returned them all along - the note the customer
   * typed, and a timeline carrying who changed the status, when, and why - and an order screen
   * that cannot answer "when did this ship, and who sent it" is a screen you end up leaving to
   * go and read the database.
   */
  note: g.note || "",
  timeline: (g.timeline || []).map((h) => ({
    status: ORDER_STATUS_LABEL[h.status] || h.status,
    rawStatus: h.status,
    note: h.note || "",
    changedBy: h.changedBy || null,
    createdAt: h.createdAt,
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
    // Kept flat, not folded into `title`: the form edits it as its own field, and the list
    // shows which products are still waiting for a translation.
    nameAr: g.nameAr || "",
    slug: g.slug,
    description: { en: g.description || "" },
    descriptionAr: g.descriptionAr || "",
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
  nameAr: g.nameAr || "",
  slug: g.slug,
  icon: g.icon || "",
  displayOrder: g.displayOrder ?? 0,
  productCount: g.productCount ?? 0,
  status: g.active === false ? "hide" : "show",
  children: [],
});

/** Build a URL-safe slug from a free-text name. */
export const slugify = (value) =>
  (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Grossimarché AdminProductSummaryResponse / ProductDetailResponse -> the shape the admin
 * product table + editor consume. The Kachabazar editor carries concepts the backend does not
 * (variants, sale price, tags, SKU); those are given inert defaults so the UI stays stable.
 */
export const adaptAdminProduct = (g) => {
  const price = Number(g.price ?? 0);
  return {
    _id: g.id,
    productId: g.id,
    title: { en: g.name },
    // Flat, not folded into `title`: the form edits it as its own field, and the list can show
    // at a glance which products are still waiting for a translation.
    nameAr: g.nameAr || "",
    slug: g.slug,
    description: { en: g.description || "" },
    descriptionAr: g.descriptionAr || "",
    prices: { price, originalPrice: price, discount: 0 },
    image: g.imageUrl ? [g.imageUrl] : [],
    stock: g.stockQuantity ?? 0,
    unit: g.unit || "unité",
    minOrderQuantity: g.minOrderQuantity ?? 1,
    status: g.active === false ? "hide" : "show",
    show: g.active !== false,
    sku: "",
    barcode: "",
    tag: "[]",
    isCombination: false,
    variants: [],
    category: g.categoryId
      ? { _id: g.categoryId, name: { en: g.categoryName } }
      : { _id: "", name: { en: "" } },
    categories: g.categoryId
      ? [{ _id: g.categoryId, name: { en: g.categoryName } }]
      : [],
  };
};

/** Grossimarché CurrencyResponse -> admin currency row. */
export const adaptCurrency = (g) => ({
  _id: g.id,
  name: g.name,
  symbol: g.symbol,
  code: g.code,
  conversionRate: g.exchangeRate,
  status: g.enabled ? "show" : "hide",
  isDefault: g.isDefault,
});

/** Grossimarché LanguageResponse -> admin language row. */
export const adaptLanguage = (g) => ({
  _id: g.id,
  name: g.name,
  iso_code: g.isoCode,
  flag: g.flag || "",
  status: g.enabled ? "show" : "hide",
  isDefault: g.isDefault,
});

/** Grossimarché AttributeResponse -> admin attribute row. */
export const adaptAttribute = (g) => ({
  _id: g.id,
  title: { en: g.name },
  name: { en: g.name },
  option: g.type === "CHECKBOX" ? "Checkbox" : "Dropdown",
  type: g.type,
  status: g.enabled ? "show" : "hide",
  variants: (g.values || []).map((v) => ({
    _id: v.id,
    name: { en: v.name },
    status: v.enabled ? "show" : "hide",
  })),
});

/** Grossimarché NotificationResponse -> admin notification row. */
export const adaptNotification = (g) => ({
  _id: g.id,
  type: g.type,
  title: g.title,
  message: g.message,
  productId: g.referenceId,
  orderId: g.type === "NEW_ORDER" ? g.referenceId : undefined,
  status: g.read ? "read" : "unread",
  read: g.read,
  createdAt: g.createdAt,
});

/** Grossimarché StoreResponse -> admin store row. */
export const adaptStore = (g) => ({
  _id: g.id,
  name: g.name,
  city: g.city,
  address: g.address,
  phone: g.phone || "",
  lat: g.lat,
  lng: g.lng,
  openingHours: g.openingHours || {},
});
