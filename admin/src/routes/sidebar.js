import {
  FiGrid,
  FiUsers,
  FiUser,
  FiCompass,
  FiSettings,
  FiSlack,
  FiGift,
  FiBell,
  FiPercent,
  FiPackage,
  FiStar,
  FiTag,
  FiUserCheck,
} from "react-icons/fi";

/**
 * ⚠ These entries only render the Sidebar. Actual Router routes live in `routes/index.js`.
 *
 * Visibility is role-based: SidebarContent filters every entry (and sub-entry) against the
 * signed-in user's access list (utils/access.js). ADMIN-only areas - Staff, Coupons,
 * Settings (stores) and the International config - are therefore hidden from a STORE_MANAGER
 * automatically; no per-item role flag is needed here.
 */
const sidebar = [
  {
    path: "/dashboard",
    icon: FiGrid,
    name: "Dashboard",
  },
  {
    icon: FiSlack,
    name: "Catalog",
    routes: [
      {
        path: "/products",
        name: "Products",
      },
      {
        path: "/categories",
        name: "Categories",
      },
      {
        path: "/attributes",
        name: "Attributes",
      },
    ],
  },
  {
    path: "/customers",
    icon: FiUsers,
    name: "Customers",
  },
  {
    path: "/approvals",
    icon: FiUserCheck,
    name: "Approvals",
  },
  {
    path: "/client-types",
    icon: FiTag,
    name: "ClientTypes",
  },
  {
    path: "/orders",
    icon: FiCompass,
    name: "Orders",
  },
  // ---- Commercial + administration ----
  // Visibility is per entry, not per block: SidebarContent filters each path against the
  // signed-in role (utils/access.js). Coupons, OurStaff and Settings are ADMIN-only there;
  // Offers and Notifications are also open to a STORE_MANAGER.
  {
    path: "/coupons",
    icon: FiGift,
    name: "Coupons",
  },
  {
    path: "/offers",
    icon: FiPercent,
    name: "Offers",
  },
  {
    path: "/bundles",
    icon: FiPackage,
    name: "Bundles",
  },
  {
    path: "/reviews",
    icon: FiStar,
    name: "Reviews",
  },
  {
    path: "/our-staff",
    icon: FiUser,
    name: "OurStaff",
  },
  {
    path: "/notifications",
    icon: FiBell,
    name: "Notifications",
  },
  {
    path: "/settings",
    icon: FiSettings,
    name: "Settings",
  },
  // ---- Hidden from the menu ----
  // "International" (Currencies + Languages) is not shown in the sidebar. The routes still
  // exist and stay reachable at /currencies and /languages for an ADMIN (see utils/access.js);
  // restore the entry below to bring the menu section back.
  // {
  //   icon: FiGlobe,
  //   name: "International",
  //   routes: [
  //     { path: "/currencies", name: "Currencies" },
  //     { path: "/languages", name: "Languages" },
  //   ],
  // },
];

export default sidebar;
