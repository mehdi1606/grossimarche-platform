import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FiFilter, FiX } from "react-icons/fi";

//internal import
import useUtilsFunction from "@hooks/useUtilsFunction";
import CategoryIcon from "@components/category/CategoryIcon";

/**
 * Left-hand product filters for the search page.
 *
 * Every filter is written to the URL and applied server-side by getServerSideProps (the
 * catalogue endpoint takes categoryId / minPrice / maxPrice / inStock). Filtering the page's
 * own array client-side would have been easier but would lie: the list is capped at 100
 * items, so the "N produits trouvés" count and any deeper result would drift.
 */
const ProductFilters = ({ categories = [] }) => {
  const router = useRouter();
  const { showingTranslateValue } = useUtilsFunction();

  const { query } = router;
  const [minPrice, setMinPrice] = useState(query.min || "");
  const [maxPrice, setMaxPrice] = useState(query.max || "");
  const [openOnMobile, setOpenOnMobile] = useState(false);

  // Keep the inputs in step with the URL (back button, reset, category change).
  useEffect(() => {
    setMinPrice(query.min || "");
    setMaxPrice(query.max || "");
  }, [query.min, query.max]);

  const activeCategory = query._id || "";
  const inStockOnly = query.stock === "1";
  const hasFilters =
    !!activeCategory || !!query.min || !!query.max || inStockOnly;

  const pushQuery = (patch) => {
    const next = { ...query, ...patch };
    // Drop empty values so the URL stays readable and getServerSideProps sees nothing set.
    Object.keys(next).forEach((k) => {
      if (next[k] === "" || next[k] === undefined || next[k] === null) delete next[k];
    });
    router.push({ pathname: "/search", query: next }, undefined, { scroll: false });
  };

  const selectCategory = (category) => {
    if (!category) {
      const { category: _c, _id: _i, ...rest } = query;
      router.push({ pathname: "/search", query: rest }, undefined, { scroll: false });
      return;
    }
    pushQuery({ category: category.slug, _id: category._id });
  };

  const applyPrice = (e) => {
    e.preventDefault();
    pushQuery({ min: minPrice, max: maxPrice });
  };

  const resetAll = () => {
    const { query: q } = query;
    router.push({ pathname: "/search", query: q ? { query: q } : {} }, undefined, {
      scroll: false,
    });
  };

  const rowCls = (active) =>
    `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
      active
        ? "bg-emerald-50 font-medium text-emerald-700"
        : "text-gray-600 hover:bg-gray-50"
    }`;

  const panel = (
    <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Catégories</h3>
        <div className="space-y-1">
          <button type="button" onClick={() => selectCategory(null)} className={rowCls(!activeCategory)}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gray-100 text-xs">
              ★
            </span>
            <span className="flex-1 truncate">Toutes les catégories</span>
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => selectCategory(c)}
              className={rowCls(activeCategory === c._id)}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-600">
                <CategoryIcon icon={c.icon} className="h-4 w-4" />
              </span>
              <span className="flex-1 truncate">{showingTranslateValue(c.name)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Prix (DH)</h3>
        <form onSubmit={applyPrice} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <span className="text-gray-300">-</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <button
            type="submit"
            className="h-10 w-full rounded-lg bg-emerald-500 text-sm font-medium text-white transition hover:bg-emerald-600"
          >
            Appliquer
          </button>
        </form>
      </div>

      {/* Availability */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Disponibilité</h3>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => pushQuery({ stock: e.target.checked ? "1" : "" })}
            className="h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400"
          />
          En stock uniquement
        </label>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={resetAll}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
        >
          <FiX className="h-4 w-4" /> Réinitialiser les filtres
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle: the panel would otherwise push the whole grid down. */}
      <button
        type="button"
        onClick={() => setOpenOnMobile((prev) => !prev)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 lg:hidden"
      >
        <FiFilter className="h-4 w-4" />
        {openOnMobile ? "Masquer les filtres" : "Filtres"}
        {hasFilters && (
          <span className="rounded-full bg-emerald-100 px-2 text-xs font-semibold text-emerald-700">
            actifs
          </span>
        )}
      </button>

      <aside className={`${openOnMobile ? "block" : "hidden"} lg:block`}>
        <div className="lg:sticky lg:top-24">{panel}</div>
      </aside>
    </>
  );
};

export default ProductFilters;
