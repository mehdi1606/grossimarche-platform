import React from "react";

/**
 * One account KPI. Quiet by default — a large number, a small label, and colour used only on
 * the icon so four of these in a row read as a set rather than four competing badges.
 */
const Card = ({ title, Icon, quantity, className }) => {
  return (
    <div className="flex h-full">
      <div className="flex w-full items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-luxe transition hover:border-emerald-200 hover:shadow-luxe-lg">
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg ${className}`}
        >
          <Icon />
        </div>
        <div className="min-w-0">
          <p className="text-2xs font-medium uppercase tracking-luxe text-ink-400">
            {title}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold leading-none tabular-nums text-ink-900">
            {quantity}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Card;
