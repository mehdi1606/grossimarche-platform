import React from "react";
import { FiCheck, FiXCircle } from "react-icons/fi";

import { STATUS_FLOW, isCancelled, stageIndex } from "@/utils/orderStatus";

/**
 * Where an order has got to, at a glance.
 *
 * Completed steps are filled, the current one is ringed, the rest are muted - the shape of the
 * row answers "how far along is this" before any word is read. A cancelled order does not get a
 * broken progress bar: it gets its own statement, because the journey stopped rather than
 * stalled, and a half-filled tracker would suggest it is still moving.
 */
const OrderStatusTracker = ({ status, size = "md" }) => {
  const dot = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const line = size === "sm" ? "top-4" : "top-[22px]";

  if (isCancelled(status)) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
          <FiXCircle className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            Commande annulée
          </p>
          <p className="text-xs text-red-500/80">
            Elle n'est plus en préparation et ne sera pas livrée.
          </p>
        </div>
      </div>
    );
  }

  const current = Math.max(0, stageIndex(status));

  return (
    <div className="flex items-start">
      {STATUS_FLOW.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = stage.Icon;
        return (
          <div key={stage.key} className="relative flex flex-1 flex-col items-center">
            {i > 0 && (
              <span
                className={`absolute right-1/2 ${line} -z-0 h-0.5 w-full transition-colors ${
                  i <= current ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-600"
                }`}
              />
            )}
            <span
              className={`relative z-10 grid ${dot} place-items-center rounded-full border-2 transition ${
                done
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : active
                  ? "border-emerald-500 bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-500/20"
                  : "border-gray-200 bg-white text-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500"
              }`}
            >
              {done ? <FiCheck className={icon} /> : <Icon className={icon} />}
            </span>
            <span
              className={`mt-2 text-center text-xs font-medium ${
                i <= current
                  ? "text-gray-800 dark:text-gray-100"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default OrderStatusTracker;
