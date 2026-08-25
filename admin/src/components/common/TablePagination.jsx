import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/**
 * Controlled table pagination.
 *
 * Replaces Windmill's `<Pagination>`, which keeps the active page in its own state. That is
 * fine while it stays mounted - but every one of these tables swaps itself for a skeleton
 * while loading, so changing page unmounted the widget and it came back believing it was on
 * page 1. The second click then asked for the page the parent was already on, nothing changed,
 * and paging appeared to be broken.
 *
 * Here the page is a prop. The component has no memory to get out of step with, so it also
 * follows correctly when something else resets the page - applying a filter, or a search.
 */
const TablePagination = ({ page = 1, totalDoc = 0, limit = 10, onChange }) => {
  const totalPages = Math.max(1, Math.ceil(totalDoc / limit));
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page), totalPages);
  const from = (current - 1) * limit + 1;
  const to = Math.min(current * limit, totalDoc);

  // A window of at most five numbers around the current page, so a hundred pages do not
  // become a hundred buttons.
  const start = Math.max(1, Math.min(current - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = [];
  for (let i = start; i <= end; i += 1) pages.push(i);

  const go = (next) => {
    const clamped = Math.min(Math.max(1, next), totalPages);
    if (clamped !== current) onChange?.(clamped);
  };

  const arrow =
    "grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-emerald-300 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500 dark:border-gray-600 dark:text-gray-400";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-gray-400">
        {from}–{to} sur {totalDoc}
      </p>

      <nav className="flex items-center gap-1.5" aria-label="Pagination">
        <button
          type="button"
          onClick={() => go(current - 1)}
          disabled={current === 1}
          aria-label="Page précédente"
          className={arrow}
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        {start > 1 && (
          <span className="px-1 text-sm text-gray-400" aria-hidden="true">
            …
          </span>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-current={p === current ? "page" : undefined}
            className={`h-9 min-w-[2.25rem] rounded-lg px-2 text-sm font-medium transition ${
              p === current
                ? "bg-emerald-500 text-white"
                : "border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600 dark:border-gray-600 dark:text-gray-300"
            }`}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <span className="px-1 text-sm text-gray-400" aria-hidden="true">
            …
          </span>
        )}

        <button
          type="button"
          onClick={() => go(current + 1)}
          disabled={current === totalPages}
          aria-label="Page suivante"
          className={arrow}
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
};

export default TablePagination;
