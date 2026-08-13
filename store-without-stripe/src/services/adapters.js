// Adapters: translate Grossimarché's flat API shapes into the shapes the KachaBazar
// components already consume (multilingual objects like { en }, `_id`, `prices`, `image[]`).
// Keeping the mapping here means the components stay untouched.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Wrap a plain string into the { en } multilingual object showingTranslateValue expects. */
export const tr = (value) => ({ en: value ?? "" });

export const isUuid = (v) => typeof v === "string" && UUID_RE.test(v);

/** Grossimarché PageResponse (or a bare array/list) -> content array. */
export const pageContent = (res) => {
  if (Array.isArray(res)) return res;
  return res?.content ?? [];
};

/**
 * Grossimarché product (summary OR detail) -> KachaBazar product shape.
 * Summary lacks stock/category/description; we degrade gracefully.
 */
export const adaptProduct = (g) => {
  if (!g) return null;
  const price = Number(g.price ?? 0);
  const stock =
    g.stockQuantity !== undefined ? g.stockQuantity : g.inStock ? 100 : 0;
  // Next.js getServerSideProps rejects `undefined` in props — use null when absent.
  const category =
    g.categoryId !== undefined && g.categoryId !== null
      ? { _id: g.categoryId, name: tr(g.categoryName) }
      : null;

  return {
    _id: g.id,
    title: tr(g.name),
    slug: g.slug,
    description: tr(g.description),
    prices: { price, originalPrice: price, discount: 0 },
    image: g.imageUrl ? [g.imageUrl] : [],
    stock,
    quantity: stock,
    unit: g.unit,
    category,
    categories: category ? [category] : [],
    tag: [],
    variants: [],
    isCombination: false,
    status: g.active === false ? "hide" : "show",
    // Grossimarché extras (used by product detail once wired):
    averageRating: g.averageRating ?? 0,
    reviewCount: g.reviewCount ?? 0,
    attributes: g.attributes ?? [],
    priceTiers: g.priceTiers ?? [],
    minOrderQuantity: g.minOrderQuantity ?? 1,
    hasQuantityDiscount: g.hasQuantityDiscount ?? false,
  };
};

export const adaptProducts = (list = []) => list.map(adaptProduct);

/** Grossimarché category -> KachaBazar category node. */
export const adaptCategory = (g) => ({
  _id: g.id,
  name: tr(g.name),
  icon: g.icon || "",
  slug: g.slug,
  parentId: null,
  parentName: null,
  children: [],
});

/**
 * KachaBazar category components read `data[0].children`, so wrap the flat Grossimarché
 * category list under a single synthetic root node.
 */
export const adaptCategoryTree = (list = []) => [
  { _id: "root", name: tr("Catégories"), icon: "", children: list.map(adaptCategory) },
];

// Grossimarché order status -> the label strings the Invoice component styles.
const ORDER_STATUS_LABEL = {
  PENDING: "Pending",
  CONFIRMED: "Processing",
  PREPARING: "Processing",
  OUT_FOR_DELIVERY: "Processing",
  DELIVERED: "Delivered",
  CANCELLED: "Cancel",
};

const paymentLabel = (m) => (m === "COD" ? "Cash On Delivery" : m);

/** Grossimarché OrderDetailResponse -> KachaBazar order shape (Invoice/OrderTable). */
export const adaptOrder = (g) => {
  if (!g) return null;
  const addr = g.deliveryAddress || {};
  return {
    _id: g.id,
    invoice: g.orderNumber,
    createdAt: g.createdAt,
    status: ORDER_STATUS_LABEL[g.status] || g.status,
    rawStatus: g.status,
    paymentMethod: paymentLabel(g.paymentMethod),
    user_info: {
      name: addr.label || "Client",
      email: "",
      contact: "",
      address: addr.addressLine || "",
      city: addr.city || "",
      country: "",
      zipCode: "",
    },
    city: addr.city || "",
    country: "",
    zipCode: "",
    cart: (g.items || []).map((it) => ({
      id: it.productId,
      title: it.productNameSnapshot,
      quantity: it.quantity,
      price: it.unitPrice,
      itemTotal: it.lineTotal,
      unit: it.unitSnapshot,
    })),
    subTotal: g.subtotal,
    shippingCost: g.deliveryFee,
    discount: Number(g.discountTotal || 0) + Number(g.couponDiscount || 0),
    couponCode: g.couponCode,
    total: g.total,
  };
};

/** Grossimarché OrderSummaryResponse -> KachaBazar order-history row. */
export const adaptOrderSummary = (g) => ({
  _id: g.id,
  invoice: g.orderNumber,
  createdAt: g.createdAt,
  status: ORDER_STATUS_LABEL[g.status] || g.status,
  paymentMethod: paymentLabel(g.paymentMethod),
  total: g.total,
});
