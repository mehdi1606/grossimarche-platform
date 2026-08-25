import { statusMeta } from "@utils/orderStatus";

/**
 * One order status, rendered the same way everywhere it appears.
 *
 * Reads the raw backend enum (PENDING…CANCELLED) rather than a pre-translated string, so
 * every status has a French label and a colour - including the three that the old table
 * silently rendered as an empty cell.
 */
const OrderStatusPill = ({ status, size = "md" }) => {
  const meta = statusMeta(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${meta.tone} ${
        size === "sm" ? "px-2 py-0.5 text-2xs" : "px-2.5 py-1 text-xs"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
};

export default OrderStatusPill;
