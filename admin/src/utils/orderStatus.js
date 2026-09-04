import {
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

/**
 * One place that knows what an order status means.
 *
 * The list and the detail page were each carrying their own copy of the lifecycle, the badge
 * colours and the French labels. Two copies of a state machine drift, and the one that drifts
 * is always the one an operator is looking at.
 *
 * The back-office collapses the API's CONFIRMED and PREPARING into a single "En préparation":
 * an operator does not distinguish "accepted" from "being packed", and the server walks the
 * intermediate steps itself when the admin jumps ahead.
 */

/** The happy path, in order. Anything not here is terminal or exceptional. */
export const STATUS_FLOW = [
  { key: "Pending", label: "En attente", Icon: FiClock },
  { key: "Processing", label: "En préparation", Icon: FiPackage },
  { key: "Out for Delivery", label: "En livraison", Icon: FiTruck },
  { key: "Delivered", label: "Livrée", Icon: FiCheckCircle },
];

export const isCancelled = (status) => status === "Cancel" || status === "Cancelled";

/** French label for any status the API can return, cancelled included. */
export const statusLabel = (status) => {
  if (isCancelled(status)) return "Annulée";
  return STATUS_FLOW.find((s) => s.key === status)?.label || status || "-";
};

/**
 * Label for a timeline entry, from the API's own status rather than the collapsed one.
 *
 * The tracker merges CONFIRMED and PREPARING into one step, which is right for "how far along
 * is this order". A history is the opposite job: it records what actually happened, and two
 * rows both reading "En préparation" describe nothing. Here the two stay apart.
 */
export const historyLabel = (rawStatus) =>
  ({
    PENDING: "Reçue",
    CONFIRMED: "Confirmée",
    PREPARING: "En préparation",
    OUT_FOR_DELIVERY: "Partie en livraison",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
  }[rawStatus] || rawStatus);

/** Windmill badge type, so the colour of a status is decided once. */
export const statusBadge = (status) => {
  if (isCancelled(status)) return "danger";
  if (status === "Delivered") return "success";
  if (status === "Pending") return "warning";
  return "primary";
};

/** Tailwind classes for the status pill used outside the tables. */
export const statusTone = (status) => {
  if (isCancelled(status)) {
    return "bg-red-50 text-red-600 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20";
  }
  if (status === "Delivered") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20";
  }
  if (status === "Pending") {
    return "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20";
  }
  return "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20";
};

export const stageIndex = (status) => STATUS_FLOW.findIndex((s) => s.key === status);

/**
 * The single step an operator should normally take next, or null when there is none.
 *
 * This is what turns status management from "pick one of four labels and press update" into one
 * obvious button. A cancelled or delivered order has no next step, and says so.
 */
export const nextStage = (status) => {
  if (isCancelled(status)) return null;
  const i = stageIndex(status);
  if (i < 0 || i >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[i + 1];
};

/** Verb for the button that performs that step - an action, not a noun. */
export const ADVANCE_VERB = {
  Processing: "Mettre en préparation",
  "Out for Delivery": "Envoyer en livraison",
  Delivered: "Marquer comme livrée",
};

/** Anything reachable from here that is not the obvious next step (skipping ahead). */
export const otherStages = (status) => {
  if (isCancelled(status)) return [];
  const i = stageIndex(status);
  const next = nextStage(status);
  return STATUS_FLOW.filter(
    (s, idx) => idx > i && s.key !== next?.key
  );
};
