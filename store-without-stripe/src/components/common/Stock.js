/**
 * Premium stock indicator. Never exposes raw counts or i18n keys to the customer - just a
 * clean status pill: in stock (green), limited (amber, scarcity nudge) or out of stock (red).
 */
const LOW_THRESHOLD = 5;

const Stock = ({ stock, card }) => {
  const out = !stock || stock <= 0;
  const low = !out && stock <= LOW_THRESHOLD;

  const label = out ? "Rupture" : low ? "Stock limité" : "En stock";
  const tone = out
    ? { chip: "bg-red-50 text-red-600", dot: "bg-red-500" }
    : low
    ? { chip: "bg-amber-50 text-amber-600", dot: "bg-amber-500" }
    : { chip: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone.chip} ${
        card ? "shadow-sm backdrop-blur-sm" : ""
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot} ${out ? "" : "animate-pulse"}`} />
      {label}
    </span>
  );
};

export default Stock;
