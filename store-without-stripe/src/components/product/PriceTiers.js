import { FiTrendingDown } from "react-icons/fi";

import useUtilsFunction from "@hooks/useUtilsFunction";
import { effectiveUnitPrice } from "@utils/pricing";

/**
 * The quantity-discount ladder - the single most important thing on a wholesale product page,
 * and previously a row of pale boxes that read as decoration.
 *
 * It is a table because that is what a buyer is doing: comparing a price against a quantity.
 * Each row states the saving in money as well as in percent, since "‑10 DH the sack" is what
 * decides an order, and the tier the current quantity has reached is marked, so the page
 * answers "what am I paying right now?" rather than leaving it to be worked out.
 */
const PriceTiers = ({ product, basePrice, quantity = 1, compact = false }) => {
  const { currency } = useUtilsFunction();
  const tiers = [...(product?.priceTiers || [])].sort(
    (a, b) => Number(a.minQuantity) - Number(b.minQuantity)
  );
  if (tiers.length === 0) return null;

  const base = Number(basePrice ?? product?.prices?.price) || 0;
  const active = effectiveUnitPrice(base, tiers, quantity);
  const unit = product?.unit || "unité";

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40 ${
        compact ? "" : "shadow-luxe"
      }`}
    >
      <header className="flex items-center gap-2 border-b border-emerald-100 px-4 py-3">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-white">
          <FiTrendingDown className="h-3.5 w-3.5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-emerald-900">Tarifs dégressifs</h3>
          {!compact && (
            <p className="text-2xs text-emerald-700/70">
              Le prix unitaire baisse automatiquement avec la quantité.
            </p>
          )}
        </div>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-2xs uppercase tracking-luxe text-emerald-700/60">
            <th className="px-4 py-2 text-start font-medium">Quantité</th>
            <th className="px-4 py-2 text-end font-medium">Prix / {unit}</th>
            <th className="px-4 py-2 text-end font-medium">Économie</th>
          </tr>
        </thead>
        <tbody>
          {/* The base price is a row of the ladder too: without it the discount has nothing
              to be a discount from. */}
          <tr
            className={`border-t border-emerald-100/70 ${
              active === base ? "bg-white" : ""
            }`}
          >
            <td className="px-4 py-2.5 text-ink-600">
              1 – {Number(tiers[0].minQuantity) - 1}
            </td>
            <td
              data-no-translate
              className="px-4 py-2.5 text-end font-semibold tabular-nums text-ink-800"
            >
              {currency}
              {base.toFixed(2)}
            </td>
            <td className="px-4 py-2.5 text-end text-ink-300">-</td>
          </tr>

          {tiers.map((tier, i) => {
            const price = Number(tier.unitPrice);
            const saving = base - price;
            const percent = base > 0 ? Math.round((saving / base) * 100) : 0;
            const next = tiers[i + 1];
            const isActive = active === price && Number(quantity) >= Number(tier.minQuantity);

            return (
              <tr
                key={tier.id || tier.minQuantity}
                className={`border-t border-emerald-100/70 transition ${
                  isActive ? "bg-emerald-600 text-white" : ""
                }`}
              >
                <td className="px-4 py-2.5">
                  <span className={isActive ? "font-semibold" : "text-ink-600"}>
                    {next
                      ? `${tier.minQuantity} – ${Number(next.minQuantity) - 1}`
                      : `${tier.minQuantity} et +`}
                  </span>
                  {isActive && (
                    <span className="ms-2 rounded-full bg-white/20 px-2 py-0.5 text-2xs font-medium">
                      Votre tarif
                    </span>
                  )}
                </td>
                <td
                  data-no-translate
                  className={`px-4 py-2.5 text-end font-semibold tabular-nums ${
                    isActive ? "text-white" : "text-emerald-700"
                  }`}
                >
                  {currency}
                  {price.toFixed(2)}
                </td>
                <td
                  data-no-translate
                  className={`px-4 py-2.5 text-end text-xs font-medium tabular-nums ${
                    isActive ? "text-emerald-50" : "text-brass-600"
                  }`}
                >
                  −{currency}
                  {saving.toFixed(2)} ({percent}%)
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};

export default PriceTiers;
