import dayjs from "dayjs";
import "dayjs/locale/fr";
import {
  FiCheck,
  FiClipboard,
  FiHome,
  FiPackage,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

import { ORDER_FLOW, statusMeta, statusStep } from "@utils/orderStatus";
import { useTranslation } from "react-i18next";

dayjs.locale("fr");

const STEP_ICON = {
  PENDING: FiClipboard,
  CONFIRMED: FiCheck,
  PREPARING: FiPackage,
  OUT_FOR_DELIVERY: FiTruck,
  DELIVERED: FiHome,
};

/**
 * "Where is my order?", answered on the page.
 *
 * Shoppers check order status several times per order, and it is the single largest source
 * of support contacts. The data was already in the API (`OrderDetailResponse.timeline`); this
 * renders it as the five-step journey plus the real timestamp of each step that has happened.
 *
 * A cancelled order does not belong on that journey, so it gets its own terminal state
 * rather than a half-filled progress bar.
 */
const OrderTimeline = ({ status, timeline = [] }) => {
  const { t } = useTranslation();
  // First occurrence wins: a status re-entered (e.g. an admin correcting a jump) should show
  // when the order *first* reached that step.
  const reachedAt = {};
  timeline.forEach((entry) => {
    if (!reachedAt[entry.status]) reachedAt[entry.status] = entry.createdAt;
  });

  if (status === "CANCELLED") {
    const cancelledAt = reachedAt.CANCELLED;
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50/70 p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-red-500 shadow-sm">
          <FiXCircle className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-ink-800">
            {t("order.cancelled")}
          </p>
          <p className="mt-0.5 text-sm text-ink-500">
            {cancelledAt
              ? `Le ${dayjs(cancelledAt).format("D MMMM YYYY à HH:mm")}`
              : "Cette commande a été annulée."}
          </p>
        </div>
      </div>
    );
  }

  const current = statusStep(status);

  return (
    <ol className="relative">
      {ORDER_FLOW.map((step, i) => {
        const Icon = STEP_ICON[step];
        const meta = statusMeta(step);
        const done = i < current;
        const active = i === current;
        const at = reachedAt[step];
        const last = i === ORDER_FLOW.length - 1;

        return (
          <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Connector - drawn behind the marker, and only between steps. */}
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute start-[19px] top-10 h-[calc(100%-2.5rem)] w-px ${
                  done ? "bg-emerald-400" : "bg-line"
                }`}
              />
            )}
            <span
              className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full ring-1 transition ${
                done
                  ? "bg-emerald-500 text-white ring-emerald-500"
                  : active
                    ? "bg-white text-emerald-600 ring-emerald-400"
                    : "bg-sand text-ink-300 ring-line"
              }`}
            >
              {done ? <FiCheck className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              {/* A quiet pulse marks where the order is right now. */}
              {active && (
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
              )}
            </span>

            <div className="min-w-0 pt-1.5">
              <p
                className={`text-sm font-semibold ${
                  done || active ? "text-ink-800" : "text-ink-400"
                }`}
              >
                {meta.label}
              </p>
              {(active || done) && (
                <p className="mt-0.5 text-xs text-ink-500">
                  {at ? dayjs(at).format("D MMMM YYYY · HH:mm") : meta.description}
                </p>
              )}
              {active && at && (
                <p className="mt-0.5 text-xs text-ink-500">{meta.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default OrderTimeline;
