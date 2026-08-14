import React from "react";
import { FiInbox } from "react-icons/fi";

/**
 * Modern, animated empty-state block (2026 UI): a floating icon inside a soft gradient halo
 * with a pulsing ring, a title, a short description and an optional call-to-action.
 *
 * Props:
 *  - icon:        a react-icons component (defaults to FiInbox)
 *  - title:       heading text
 *  - description: supporting line
 *  - actionLabel + onAction: optional CTA button
 */
const EmptyState = ({
  icon: Icon = FiInbox,
  title = "Nothing here yet",
  description = "Once you add data, it will show up here.",
  actionLabel,
  onAction,
}) => {
  return (
    <div className="relative w-full flex flex-col items-center justify-center text-center gm-fade-in-up py-16 px-6">
      {/* decorative animated accents */}
      <span className="gm-blob" style={{ top: 10, left: "38%" }} aria-hidden="true" />
      <span
        className="gm-blob"
        style={{ bottom: 4, right: "36%", animationDelay: "2.5s" }}
        aria-hidden="true"
      />

      <div className="gm-empty-halo gm-float mb-7" aria-hidden="true">
        <Icon className="w-11 h-11" strokeWidth={1.6} />
      </div>

      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-emerald-500/40 focus:outline-none"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
