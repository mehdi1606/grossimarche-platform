import { useContext } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { IoClose } from "react-icons/io5";
import {
  FiGift,
  FiHelpCircle,
  FiInfo,
  FiMail,
  FiPackage,
  FiUser,
} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

//internal import
import Loading from "@components/preloader/Loading";
import BrandMark from "@components/common/BrandMark";
import { SidebarContext } from "@context/SidebarContext";
import CategoryServices from "@services/CategoryServices";
import CategoryCard from "@components/category/CategoryCard";
import useCanSeeOffers from "@hooks/useCanSeeOffers";
import useUtilsFunction from "@hooks/useUtilsFunction";

/**
 * The pages worth reaching from the mobile menu, in the shopper's language.
 *
 * Defined here rather than pulled from `@utils/data`, whose entries are still the template's
 * untranslated keys ("offer-page", "checkout-page") - they were rendering literally.
 */
const PAGES = [
  // Baskets are priced per trade; a shopper without one reaches an empty page - see
  // useCanSeeOffers.
  { title: "common.bundles_offers", href: "/offer", icon: FiGift, needsSegment: true },
  { title: "common.all_products", href: "/search", icon: FiPackage },
  { title: "common.account", href: "/user/dashboard", icon: FiUser },
  { title: "common.about", href: "/about-us", icon: FiInfo },
  { title: "common.contact", href: "/contact-us", icon: FiMail },
  { title: "common.faq", href: "/faq", icon: FiHelpCircle },
];

/**
 * The mobile category menu.
 *
 * It still carried the KachaBazar logo from the original template - the one place in the
 * storefront where another shop's brand was on screen. It now uses the same mark as the rest
 * of the site.
 *
 * Sized for a phone held in one hand: rows are 48px so they can be hit with a thumb, the list
 * scrolls under a header that stays put, and the bottom padding clears the home indicator on
 * a notched device.
 */
const Category = () => {
  const { t } = useTranslation();
  const canSeeOffers = useCanSeeOffers();
  const { closeCategoryDrawer } = useContext(SidebarContext);
  const { showingTranslateValue } = useUtilsFunction();

  // `isPending`, not `isLoading`: the latter is false on the very first render, before the fetch
  // starts, so a drawer that had just been re-created announced "no categories" for a frame.
  const { data, error, isPending } = useQuery({
    queryKey: ["category"],
    queryFn: async () => await CategoryServices.getShowingCategory(),
  });

  const categories = data?.[0]?.children || [];

  return (
    <div data-no-translate className="flex h-full w-full flex-col bg-white">
      {/* Header - stays put while the list scrolls under it. */}
      <div className="flex shrink-0 items-center justify-between gap-3 bg-emerald-700 px-5 py-4">
        <BrandMark variant="light" href="/" />
        <button
          onClick={closeCategoryDrawer}
          aria-label={t("common.close_menu")}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
        >
          <IoClose className="text-xl" />
        </button>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <h2 className="px-5 pb-2 pt-5 text-2xs font-semibold uppercase tracking-luxe text-ink-400">
          {t("common.categories")}
        </h2>

        {isPending ? (
          <Loading loading={true} />
        ) : error ? (
          <p className="px-5 py-6 text-sm text-red-500">
            {error?.response?.data?.message || error?.message}
          </p>
        ) : categories.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-400">{t("common.no_categories")}</p>
        ) : (
          <div className="grid gap-0.5 px-3 pb-2">
            {categories.map((category) => (
              <CategoryCard
                key={category._id}
                id={category._id}
                icon={category.icon}
                nested={category.children}
                title={showingTranslateValue(category?.name)}
              />
            ))}
          </div>
        )}

        <h2 className="mt-4 border-t border-line px-5 pb-2 pt-5 text-2xs font-semibold uppercase tracking-luxe text-ink-400">
          {t("common.pages")}
        </h2>
        <nav className="grid gap-0.5 px-3 pb-6">
          {PAGES.filter((item) => !item.needsSegment || canSeeOffers).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeCategoryDrawer}
              className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-2.5 text-sm font-medium text-ink-700 transition hover:bg-cream hover:text-emerald-700"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sand text-ink-500">
                <item.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              {t(item.title)}
            </Link>
          ))}
        </nav>

        {/* Clears the home indicator on a notched phone, where a drawer ending flush with the
            screen puts its last row under the system bar. */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
};

export default Category;
