import React from "react";

/**
 * Shimmer skeleton for list/table loading (2026 UI): soft animated placeholder rows that
 * mirror the real table layout, so the page keeps its shape while data loads. Use in place of
 * a plain "Loading…" label.
 *
 * Props:
 *  - rows: number of placeholder rows (default 6)
 *  - cols: number of columns (default 5)
 */
const TableSkeleton = ({ rows = 6, cols = 5 }) => {
  return (
    <div className="gm-fade-in-up w-full overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* header strip */}
      <div
        className="grid gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="gm-skeleton h-3.5" style={{ width: `${60 + ((i * 13) % 30)}%` }} />
        ))}
      </div>

      {/* body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid items-center gap-4 border-b border-gray-50 px-5 py-4 last:border-0 dark:border-gray-700/60"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="flex items-center gap-3">
              {c === 0 && <div className="gm-skeleton h-9 w-9 shrink-0 rounded-full" />}
              <div
                className="gm-skeleton h-3.5"
                style={{ width: `${50 + ((r * 7 + c * 17) % 45)}%` }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton;
