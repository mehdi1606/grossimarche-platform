import React from "react";
import { FiPlus, FiX } from "react-icons/fi";

//internal import
import { clientTypeIcon } from "@/utils/clientTypeIcons";

/**
 * Choosing which client types something is sold to, and what each pays.
 *
 * Shared by products and bundles so the two cannot drift apart: they are the same decision made
 * about two different things, and a merchant who learns it once should not have to learn it
 * again on the next screen.
 *
 * Segments are added by clicking their name, not picked from a dropdown inside each row. A
 * dropdown per row asks the same question twice - which segment, then which price - and hides
 * the ones still available behind a click. Here the remaining segments are on screen as
 * chips: what is priced is a row, what is not is a chip, and moving between the two is one tap.
 *
 * The name is rendered as text rather than a form control for the same reason. It also fixes a
 * real defect: Windmill's Select carries `block w-full`, which beat the width class next to it
 * and squeezed the name down to its chevron - the segment being priced was invisible.
 */
const SegmentPriceEditor = ({
  clientTypes = [],
  value = [],
  onChange,
  currency = "DH",
  title = "Prix par type de client",
  hint,
  emptyWarning,
  renderInfo,
}) => {
  const byId = Object.fromEntries(clientTypes.map((t) => [t.id, t]));
  const available = clientTypes.filter((t) => !value.some((r) => r.clientTypeId === t.id));

  const add = (id) => onChange([...value, { clientTypeId: id, price: "" }]);
  const remove = (index) => onChange(value.filter((_, i) => i !== index));
  const setPrice = (index, price) =>
    onChange(value.map((r, i) => (i === index ? { ...r, price } : r)));

  if (clientTypes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 p-5 text-center dark:border-gray-600">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucun type de client n&apos;existe encore.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Créez d&apos;abord vos segments dans « Types de clients ».
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-3.5 dark:border-gray-700 dark:bg-gray-900/40">
        <h4 className="text-sm font-semibold tracking-tight text-gray-800 dark:text-gray-100">
          {title}
        </h4>
        {hint && (
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
      </div>

      <div className="p-5">
        {value.length === 0 ? (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-500/10">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              {emptyWarning}
            </p>
          </div>
        ) : (
          <div className="mb-5 grid gap-2.5">
            {value.map((row, index) => {
              const type = byId[row.clientTypeId];
              const Icon = clientTypeIcon(type?.icon);
              return (
                <div key={row.clientTypeId || index}>
                  <div className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition hover:border-emerald-300 dark:border-gray-700 dark:bg-gray-800">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </span>

                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                      {type?.name || "Type supprimé"}
                    </span>

                    {/* The width lives on the wrapper: Windmill's own `w-full` on the input
                        would win against a width class placed on it directly. */}
                    <div className="relative w-36 shrink-0">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={row.price}
                        onChange={(e) => setPrice(index, e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-3 pr-11 text-right text-sm font-semibold tabular-nums text-gray-800 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                        {currency}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(index)}
                      title="Retirer ce type"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>

                  {renderInfo?.(row)}
                </div>
              );
            })}
          </div>
        )}

        {available.length > 0 && (
          <div>
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-gray-400">
              {value.length === 0 ? "Choisissez un type" : "Ajouter un type"}
            </p>
            <div className="flex flex-wrap gap-2">
              {available.map((type) => {
                const Icon = clientTypeIcon(type.icon);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => add(type.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-emerald-500/10"
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {type.name}
                    <FiPlus className="h-3 w-3 opacity-60" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SegmentPriceEditor;
