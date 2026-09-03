import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { FiChevronRight, FiRefreshCw } from "react-icons/fi";

import useReorder from "@hooks/useReorder";
import OrderStatusPill from "@components/order/OrderStatusPill";
import { ORDER_FLOW, statusStep, isCancelled } from "@utils/orderStatus";

dayjs.locale("fr");

/**
 * One order in the account area.
 *
 * Replaces a six-column English table (`ID / OrderTime / Method / Status / Total / Action`)
 * that was unreadable on a phone and whose status cell was blank for half the backend's
 * states. The two things a returning wholesale customer actually wants are here as first-class
 * actions: follow this order, or order it again.
 */
const OrderCard = ({ order, currency = "" }) => {
  const { reorder, reorderingId } = useReorder();
  const step = statusStep(order.status);
  const progress = isCancelled(order.status)
    ? 0
    : ((step + 1) / ORDER_FLOW.length) * 100;

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-luxe transition hover:border-emerald-200 hover:shadow-luxe-lg sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p data-no-translate className="font-display text-base font-semibold text-ink-900">
              {order.invoice || `#${order._id?.slice(0, 8)}`}
            </p>
            <OrderStatusPill status={order.status} size="sm" />
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {dayjs(order.createdAt).format("D MMMM YYYY")} · {order.paymentMethod}
          </p>
        </div>
        <p data-no-translate className="font-display text-lg font-semibold tabular-nums text-ink-900">
          {currency}
          {parseFloat(order.total || 0).toFixed(2)}
        </p>
      </div>

      {/* A one-line read on how far along the order is, without opening it. */}
      {!isCancelled(order.status) && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/order/${order._id}`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:flex-none"
        >
          Suivre ma commande
          <FiChevronRight className="gm-dir-icon h-4 w-4" />
        </Link>
        <button
          onClick={() => reorder(order._id)}
          disabled={reorderingId === order._id}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60 sm:flex-none"
        >
          <FiRefreshCw
            className={`h-3.5 w-3.5 ${reorderingId === order._id ? "animate-spin" : ""}`}
          />
          Commander à nouveau
        </button>
      </div>
    </div>
  );
};

export default OrderCard;
