// Role-based back-office access. This is the single source of truth the Sidebar and the
// route guard (layout/Main.jsx, via hooks/useGetCData) both read.
//
// Mirrors the backend authorization split (SecurityConfig + @PreAuthorize):
//   - STORE_MANAGER → core store operations: dashboard, products, categories, attributes,
//     customers, orders, notifications (+ their detail sub-routes and the profile page).
//   - ADMIN → everything above PLUS the exclusive areas: staff, coupons, settings (stores)
//     and the currency/language configuration.
//
// Keys are the first path segment (e.g. "/coupons" → "coupons", "/customer-order/:id" →
// "customer-order"), which is exactly what Main.jsx / SidebarContent extract from the URL.

// Core operations available to every back-office user (STORE_MANAGER and ADMIN).
const STORE_MANAGER_ROUTES = [
  "dashboard",
  "products",
  "product", // product detail
  "categories",
  "attributes",
  "customers",
  "approvals", // customer validation queue - day-to-day judgement, not policy
  "customer-order", // a customer's order detail
  "orders",
  "order", // order invoice detail
  "offers", // quantity-discount tiers - part of catalogue pricing
  "bundles", // bundle offers ("paniers") - also catalogue pricing
  "reviews", // customer-review moderation
  "notifications",
  "edit-profile",
];

// ADMIN-exclusive areas layered on top of the core.
const ADMIN_ONLY_ROUTES = [
  "our-staff",
  // Client types cut the whole price grid: creating one decides how every product has to
  // be priced from then on. Commercial policy, not a store manager's daily catalogue work.
  "client-types",
  "coupons",
  "settings", // → store / magasins management
  "currencies",
  "languages",
];

const ADMIN_ROUTES = [...STORE_MANAGER_ROUTES, ...ADMIN_ONLY_ROUTES];

const ACCESS_BY_ROLE = {
  ADMIN: ADMIN_ROUTES,
  STORE_MANAGER: STORE_MANAGER_ROUTES,
};

/** Route keys the given role may access. Unknown/missing role → no access. */
export const accessListForRole = (role) => ACCESS_BY_ROLE[role] ?? [];

/** True if the role may reach the given first-path-segment route key. */
export const canAccessRoute = (role, routeKey) =>
  accessListForRole(role).includes(routeKey);

export { ADMIN_ONLY_ROUTES, ADMIN_ROUTES, STORE_MANAGER_ROUTES };
