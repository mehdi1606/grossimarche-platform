import {
  FiGrid,
  FiUsers,
  FiUser,
  FiCompass,
  FiSettings,
  FiSlack,
  FiGift,
  FiBell,
} from "react-icons/fi";

/**
 * ⚠ These entries only render the Sidebar. Actual Router routes live in `routes/index.js`.
 *
 * Visibility is role-based: SidebarContent filters every entry (and sub-entry) against the
 * signed-in user's access list (utils/access.js). ADMIN-only areas — Staff, Coupons,
 * Settings (stores) and the International config — are therefore hidden from a STORE_MANAGER
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
    path: "/orders",
    icon: FiCompass,
    name: "Orders",
  },
  {
    path: "/notifications",
    icon: FiBell,
    name: "Notifications",
  },

  // ---- ADMIN-only (hidden from STORE_MANAGER by the access-list filter) ----
  {
    path: "/coupons",
    icon: FiGift,
    name: "Coupons",
  },
  {
    path: "/our-staff",
    icon: FiUser,
    name: "OurStaff",
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
