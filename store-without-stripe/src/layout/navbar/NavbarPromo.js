import { Fragment, useContext } from "react";
import Link from "next/link";
import { Transition, Popover } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "@heroicons/react/outline";
import { FiGrid } from "react-icons/fi";

//internal import
import CategoryMenu from "@components/category/CategoryMenu";
import LanguageMenu from "@components/common/LanguageMenu";
import { SidebarContext } from "@context/SidebarContext";

// Keys, not labels: this array is built at module load, where no hook can run.
const NAV_LINKS = [
  { href: "/search", key: "all_products" },
  { href: "/offer", key: "offers" },
  { href: "/about-us", key: "about" },
  { href: "/contact-us", key: "contact" },
  { href: "/faq", key: "faq" },
];

const NavbarPromo = () => {
  const { isLoading, setIsLoading } = useContext(SidebarContext);
  // The catalogue, not the LibreTranslate helper this used to call. Navigation is read on
  // every page: it has to be instant, and it has to be exactly right.
  const { t } = useTranslation();

  return (
    <div data-no-translate className="hidden border-b border-line bg-white lg:block">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-10 h-12 flex justify-between items-center">
        {/* Left: navigation */}
        <Popover.Group as="nav" className="flex items-center space-x-8">
          {/* Categories mega-dropdown */}
          <Popover className="relative">
            <Popover.Button className="group inline-flex items-center py-2 text-sm font-medium text-ink-700 transition hover:text-emerald-700 focus:outline-none">
              <FiGrid className="me-2 h-4 w-4" />
              <span>{t("common.categories")}</span>
              <ChevronDownIcon
                className="ms-1 h-3 w-3 transition group-hover:text-emerald-700"
                aria-hidden="true"
              />
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute start-0 z-20 mt-1 w-80">
                {({ close }) => (
                  <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-luxe-lg">
                    <CategoryMenu onNavigate={close} />
                  </div>
                )}
              </Popover.Panel>
            </Transition>
          </Popover>

          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsLoading(!isLoading)}
              className="py-2 text-sm font-medium text-ink-700 transition hover:text-emerald-700"
            >
              {t(`common.${item.key}`)}
            </Link>
          ))}
        </Popover.Group>

        {/* Right: language selector (renders itself only when there is a real choice) */}
        <LanguageMenu />
      </div>
    </div>
  );
};

export default NavbarPromo;
