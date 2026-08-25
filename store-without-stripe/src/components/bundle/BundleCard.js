import Link from "next/link";
import { FiPackage, FiPlus, FiShoppingCart } from "react-icons/fi";

import useUtilsFunction from "@hooks/useUtilsFunction";

/**
 * One bundle offer - a "panier".
 *
 * The whole point of the card is the comparison: what the set contains, what those items cost
 * separately, and what the set costs. A saving nobody can see is a saving nobody acts on, so
 * the struck-through components total and the amount saved are given as much weight as the
 * price itself.
 */
const BundleCard = ({ bundle, onAdd, adding = false, compact = false }) => {
  const { currency } = useUtilsFunction();
  const items = bundle?.items || [];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-luxe transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-luxe-lg">
      <div className="relative flex h-40 items-center justify-center bg-sand/70">
        {bundle.imageUrl ? (
          <img
            src={bundle.imageUrl}
            alt={bundle.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-2xl text-emerald-500 shadow-sm">
            <FiPackage />
          </span>
        )}
        {bundle.savingsPercent > 0 && (
          <span
            data-no-translate
            className="absolute right-3 top-3 rounded-full bg-brass-400 px-2.5 py-1 text-2xs font-bold text-emerald-900 shadow-sm"
          >
            −{bundle.savingsPercent}%
          </span>
        )}
        {!bundle.available && (
          <span className="absolute inset-x-0 bottom-0 bg-ink-900/80 py-1.5 text-center text-2xs font-medium text-white">
            Temporairement indisponible
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold text-ink-900">{bundle.name}</h3>
        {bundle.description && !compact && (
          <p className="mt-1.5 line-clamp-2 text-sm text-ink-500">{bundle.description}</p>
        )}

        {/* What is in the set. This is the offer - hiding it behind a link would make the
            price meaningless. */}
        <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
          {items.slice(0, compact ? 3 : 6).map((item) => (
            <li
              key={item.productId}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <Link
                href={`/product/${item.slug}`}
                className={`min-w-0 truncate transition hover:text-emerald-700 ${
                  item.available ? "text-ink-700" : "text-ink-400 line-through"
                }`}
              >
                {item.name}
              </Link>
              <span data-no-translate className="shrink-0 text-xs tabular-nums text-ink-400">
                ×{item.quantity}
              </span>
            </li>
          ))}
          {items.length > (compact ? 3 : 6) && (
            <li className="text-xs text-ink-400">
              +{items.length - (compact ? 3 : 6)} autre(s) article(s)
            </li>
          )}
        </ul>

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p data-no-translate className="text-xs text-ink-400 line-through tabular-nums">
                {currency}
                {Number(bundle.componentsTotal).toFixed(2)}
              </p>
              <p
                data-no-translate
                className="font-display text-2xl font-semibold tabular-nums text-ink-900"
              >
                {currency}
                {Number(bundle.price).toFixed(2)}
              </p>
            </div>
            {Number(bundle.savings) > 0 && (
              <p className="pb-1 text-right text-xs font-semibold text-brass-600">
                Vous économisez
                <br />
                <span data-no-translate className="tabular-nums">
                  {currency}
                  {Number(bundle.savings).toFixed(2)}
                </span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onAdd?.(bundle)}
            disabled={!bundle.available || adding}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-luxe transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding ? (
              <FiPlus className="h-4 w-4 animate-spin" />
            ) : (
              <FiShoppingCart className="h-4 w-4" />
            )}
            {adding ? "Ajout…" : "Ajouter le panier"}
          </button>
        </div>
      </div>
    </article>
  );
};

export default BundleCard;
