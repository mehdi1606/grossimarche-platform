import { lazy } from "react";

// use lazy for better code splitting
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Products = lazy(() => import("@/pages/Products"));
const Bundles = lazy(() => import("@/pages/Bundles"));
const Reviews = lazy(() => import("@/pages/Reviews"));
const ProductDetails = lazy(() => import("@/pages/ProductDetails"));
const Category = lazy(() => import("@/pages/Category"));
const ChildCategory = lazy(() => import("@/pages/ChildCategory"));
const Staff = lazy(() => import("@/pages/Staff"));
const Customers = lazy(() => import("@/pages/Customers"));
const ClientTypes = lazy(() => import("@/pages/ClientTypes"));
const Approvals = lazy(() => import("@/pages/Approvals"));
const Delivery = lazy(() => import("@/pages/Delivery"));
const CustomerOrder = lazy(() => import("@/pages/CustomerOrder"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderDetail = lazy(() => import("@/pages/OrderDetail"));
const OrderInvoice = lazy(() => import("@/pages/OrderInvoice"));
const Coupons = lazy(() => import("@/pages/Coupons"));
// const Setting = lazy(() => import("@/pages/Setting"));
const Page404 = lazy(() => import("@/pages/404"));
const ComingSoon = lazy(() => import("@/pages/ComingSoon"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const Languages = lazy(() => import("@/pages/Languages"));
const Currencies = lazy(() => import("@/pages/Currencies"));
const Setting = lazy(() => import("@/pages/Setting"));
const Notifications = lazy(() => import("@/pages/Notifications"));
/*
//  * ⚠ These are internal routes!
//  * They will be rendered inside the app, using the default `containers/Layout`.
//  * If you want to add a route to, let's say, a landing page, you should add
//  * it to the `App`'s router, exactly like `Login`, `CreateAccount` and other pages
//  * are routed.
//  *
//  * If you're looking for the links rendered in the SidebarContent, go to
//  * `routes/sidebar.js`
 */

const routes = [
  {
    path: "/dashboard",
    component: Dashboard,
  },
  {
    path: "/products",
    component: Products,
  },
  {
    path: "/product/:id",
    component: ProductDetails,
  },
  {
    path: "/categories",
    component: Category,
  },
  {
    path: "/languages",
    component: Languages,
  },
  {
    path: "/currencies",
    component: Currencies,
  },

  {
    path: "/categories/:id",
    component: ChildCategory,
  },
  {
    path: "/customers",
    component: Customers,
  },
  {
    path: "/customer-order/:id",
    component: CustomerOrder,
  },
  {
    path: "/our-staff",
    component: Staff,
  },
  {
    path: "/orders",
    component: Orders,
  },
  // The order itself, and the printable invoice made from it. Managing an order and printing
  // one are different jobs, so they are different pages rather than one page with a mode.
  {
    path: "/order/:id",
    component: OrderDetail,
  },
  {
    path: "/order/:id/invoice",
    component: OrderInvoice,
  },
  {
    path: "/coupons",
    component: Coupons,
  },
  {
    path: "/bundles",
    component: Bundles,
  },
  {
    path: "/reviews",
    component: Reviews,
  },
  {
    path: "/client-types",
    component: ClientTypes,
  },
  {
    path: "/approvals",
    component: Approvals,
  },
  {
    path: "/delivery",
    component: Delivery,
  },
  { path: "/settings", component: Setting },
  {
    path: "/404",
    component: Page404,
  },
  {
    path: "/coming-soon",
    component: ComingSoon,
  },
  {
    path: "/edit-profile",
    component: EditProfile,
  },
  {
    path: "/notifications",
    component: Notifications,
  },
];

const routeAccessList = [
  // {
  //   label: "Root",
  //   value: "/",
  // },
  { label: "Tableau de bord", value: "dashboard" },
  { label: "Produits", value: "products" },
  { label: "Catégories", value: "categories" },
  { label: "Coupons", value: "coupons" },
  { label: "Paniers", value: "bundles" },
  { label: "Avis", value: "reviews" },
  { label: "Clients", value: "customers" },
  { label: "Types de client", value: "client-types" },
  { label: "Validations", value: "approvals" },
  { label: "Livraison", value: "delivery" },
  { label: "Commandes", value: "orders" },
  { label: "Équipe", value: "our-staff" },
  { label: "Réglages", value: "settings" },
  { label: "Langues", value: "languages" },
  { label: "Devises", value: "currencies" },
  { label: "ViewStore", value: "store" },
  { label: "StoreCustomization", value: "customization" },
  { label: "StoreSettings", value: "store-settings" },
  { label: "Fiche produit", value: "product" },
  { label: "Facture de commande", value: "order" },
  { label: "Modifier le profil", value: "edit-profile" },
  {
    label: "Commandes du client",
    value: "customer-order",
  },
  { label: "Notifications", value: "notifications" },
  { label: "Coming Soon", value: "coming-soon" },
];

export { routeAccessList, routes };
