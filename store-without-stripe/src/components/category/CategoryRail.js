import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

//internal import
import useUtilsFunction from "@hooks/useUtilsFunction";
import { categoryEmoji } from "@utils/categoryIcon";

/**
 * Category carousel: one row that scrolls sideways instead of wrapping onto a second line.
 *
 * Scrolling is the browser's own (overflow-x + scroll snap), so trackpad, touch swipe and
 * shift+wheel all work; the arrows just drive scrollBy on the same track. They disable
 * themselves at each end, and the whole row is hidden from the arrows' logic when
 * everything already fits.
 */
const CategoryRail = ({ categories = [] }) => {
  const { showingTranslateValue } = useUtilsFunction();
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // 4px tolerance: sub-pixel widths never land exactly on the boundary.
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync, categories.length]);

  const page = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    // One full page: the visible row holds exactly 4 cards, so this lands on the next 4
    // (scroll-snap absorbs the rounding).
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  };

  if (!categories.length) return null;

  const arrowCls =
    "grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-emerald-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500";

  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-14 sm:px-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-gray-800">Catégories</h2>
          <p className="mt-1 text-sm text-gray-500">
            Trouvez ce qu&apos;il vous faut en un clic.
          </p>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={atStart}
            aria-label="Catégories précédentes"
            className={arrowCls}
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={atEnd}
            aria-label="Catégories suivantes"
            className={arrowCls}
          >
            <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="gm-rail flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
      >
        {categories.map((c) => (
          <Link
            key={c._id}
            href={`/search?category=${c.slug}&_id=${c._id}`}
            /* Cards are sized as a fraction of the track, not a fixed width, so exactly 4
               fill the row on desktop (3 gaps of 0.75rem to subtract) and the rest sit
               off-screen. Below md that would give unreadable 90px cards, hence 2 then 3. */
            className="group flex shrink-0 grow-0 basis-[calc((100%-0.75rem)/2)] snap-start flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md sm:basis-[calc((100%-1.5rem)/3)] md:basis-[calc((100%-2.25rem)/4)]"
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-2xl transition group-hover:bg-emerald-100">
              {categoryEmoji(c.icon)}
            </span>
            <span className="line-clamp-1 text-sm font-medium text-gray-700">
              {showingTranslateValue(c.name)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryRail;
