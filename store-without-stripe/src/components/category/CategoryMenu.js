import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

//internal import
import useUtilsFunction from "@hooks/useUtilsFunction";
import CategoryServices from "@services/CategoryServices";
import CategoryIcon from "@components/category/CategoryIcon";

/**
 * The desktop "Catégories" dropdown.
 *
 * It used to render the mobile drawer, which brought a green header with the full logo, a close
 * button that closed nothing here, a fixed 65vh height that stayed tall for a single category,
 * two nested scroll containers - so two scrollbars - and a "Pages" list repeating the links
 * sitting a few pixels to its right in the same bar. This shows categories, and nothing else.
 */
const CategoryMenu = ({ onNavigate }) => {
  const { showingTranslateValue } = useUtilsFunction();

  // `isPending` rather than `isLoading`: the latter is false on the first render, before the
  // fetch starts, which showed "no categories" for a frame instead of the skeleton.
  const { data, error, isPending } = useQuery({
    queryKey: ["category"],
    queryFn: async () => await CategoryServices.getShowingCategory(),
  });

  const categories = data?.[0]?.children || [];

  const rowCls =
    "flex min-h-[44px] items-center gap-3 rounded-xl px-2.5 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-cream hover:text-emerald-700";

  return (
    // One scroll container, and only past 70% of the viewport: a short list keeps a short panel.
    <div className="max-h-[70vh] overflow-y-auto overscroll-contain p-2">
      {isPending ? (
        <div className="space-y-1 p-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-1.5 py-2">
              <span className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-sand" />
              <span className="h-3 w-32 animate-pulse rounded bg-sand" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="px-3 py-6 text-sm text-red-500">
          {error?.response?.data?.message || error?.message}
        </p>
      ) : categories.length === 0 ? (
        <p className="px-3 py-6 text-sm text-ink-400">Aucune catégorie pour le moment.</p>
      ) : (
        <div className="grid gap-0.5">
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/search?category=${category.slug}&_id=${category._id}`}
              onClick={onNavigate}
              className={rowCls}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <CategoryIcon icon={category.icon} className="h-4 w-4" />
              </span>
              <span className="truncate">{showingTranslateValue(category?.name)}</span>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/search"
        onClick={onNavigate}
        className="mt-1 flex items-center justify-between gap-3 rounded-xl border-t border-line px-2.5 py-3 text-sm font-medium text-emerald-700 transition hover:bg-cream"
      >
        Tous les produits
        <FiArrowRight className="gm-dir-icon h-4 w-4" />
      </Link>
    </div>
  );
};

export default CategoryMenu;
