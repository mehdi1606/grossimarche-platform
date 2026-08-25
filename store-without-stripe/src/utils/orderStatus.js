/**
 * The customer-facing vocabulary for the backend's six order states.
 *
 * The backend enum is `PENDING → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED`,
 * with `CANCELLED` reachable from any non-terminal state. Everything the shopper sees about
 * an order - label, colour, timeline step, what they may still do - is derived from here,
 * so a new state is added in exactly one place.
 */

/** The linear happy path, in order. `CANCELLED` is deliberately not a step on it. */
export const ORDER_FLOW = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const ORDER_STATUS = {
  PENDING: {
    label: "En attente",
    // Written from the shopper's side: what is happening to *their* order right now.
    description: "Nous avons bien reçu votre commande, elle va être confirmée.",
    tone: "text-amber-700 bg-amber-50 ring-amber-200",
    dot: "bg-amber-500",
  },
  CONFIRMED: {
    label: "Confirmée",
    description: "Votre commande est validée par notre équipe.",
    tone: "text-emerald-700 bg-emerald-50 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  PREPARING: {
    label: "En préparation",
    description: "Vos articles sont en cours de préparation dans notre entrepôt.",
    tone: "text-emerald-700 bg-emerald-50 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  OUT_FOR_DELIVERY: {
    label: "En cours de livraison",
    description: "Votre commande est en route.",
    tone: "text-emerald-800 bg-emerald-100 ring-emerald-300",
    dot: "bg-emerald-600",
  },
  DELIVERED: {
    label: "Livrée",
    description: "Votre commande vous a été remise. Merci !",
    tone: "text-emerald-800 bg-emerald-100 ring-emerald-300",
    dot: "bg-emerald-600",
  },
  CANCELLED: {
    label: "Annulée",
    description: "Cette commande a été annulée.",
    tone: "text-red-700 bg-red-50 ring-red-200",
    dot: "bg-red-500",
  },
};

const FALLBACK = {
  label: "Statut inconnu",
  description: "",
  tone: "text-ink-600 bg-ink-100 ring-ink-200",
  dot: "bg-ink-400",
};

/**
 * Never returns undefined: an unrecognised status (a backend deploy ahead of the store)
 * degrades to a neutral chip instead of rendering an empty cell, which is what the old
 * four-string lookup used to do.
 */
export const statusMeta = (status) => ORDER_STATUS[status] || FALLBACK;

export const statusLabel = (status) => statusMeta(status).label;

/** Position on the happy path, or -1 for a cancelled/unknown order. */
export const statusStep = (status) => ORDER_FLOW.indexOf(status);

export const isCancelled = (status) => status === "CANCELLED";

export const isDelivered = (status) => status === "DELIVERED";

/**
 * Whether the customer may still cancel this themselves. Mirrors `OrderService.cancelOwn`:
 * only while PENDING, because once the shop confirms, stock and picking are committed.
 */
export const canCustomerCancel = (status) => status === "PENDING";
