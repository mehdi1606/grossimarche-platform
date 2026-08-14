import { Fragment, useContext } from "react";
import Link from "next/link";
import { Transition, Popover } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/outline";
import Cookies from "js-cookie";
import { FiGrid } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

//internal import
import SettingServices from "@services/SettingServices";
import useGetSetting from "@hooks/useGetSetting";
import Category from "@components/category/Category";
import { SidebarContext } from "@context/SidebarContext";

const NAV_LINKS = [
  { href: "/search", label: "Tous les produits" },
  { href: "/offer", label: "Offres" },
  { href: "/about-us", label: "À propos" },
  { href: "/contact-us", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

const NavbarPromo = () => {
  const { lang } = useGetSetting();
  const { isLoading, setIsLoading } = useContext(SidebarContext);

  const handleLanguage = (language) => {
    Cookies.set("_lang", language?.iso_code, { sameSite: "None", secure: true });
    Cookies.set("_curr_lang", JSON.stringify(language), {
      sameSite: "None",
      secure: true,
    });
  };

  const { data: languages } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => await SettingServices.getShowingLanguage(),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const currentLanguageCookie = Cookies.get("_curr_lang");
  let currentLang = null;
  if (currentLanguageCookie && currentLanguageCookie !== "undefined") {
    try {
      currentLang = JSON.parse(currentLanguageCookie);
    } catch (error) {
      currentLang = null;
    }
  }

  return (
    <div className="hidden lg:block bg-white border-b border-gray-100">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-10 h-12 flex justify-between items-center">
        {/* Left: navigation */}
        <Popover.Group as="nav" className="flex items-center space-x-8">
          {/* Categories mega-dropdown */}
          <Popover className="relative">
            <Popover.Button className="group inline-flex items-center py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 focus:outline-none">
              <FiGrid className="mr-2 h-4 w-4" />
              <span>Catégories</span>
              <ChevronDownIcon
                className="ml-1 h-3 w-3 group-hover:text-emerald-600"
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
              <Popover.Panel className="absolute z-10 -ml-1 mt-1 transform w-screen max-w-xs c-h-65vh bg-white">
                <div className="rounded-md shadow-lg ring-1 ring-black ring-opacity-5 overflow-y-scroll flex-grow scrollbar-hide w-full h-full">
                  <Category />
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>

          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsLoading(!isLoading)}
              className="py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition"
            >
              {item.label}
            </Link>
          ))}
        </Popover.Group>

        {/* Right: language selector (only when more than one language) */}
        {languages?.length > 1 && (
          <div className="dropdown">
            <div className={`flot-l flag ${currentLang?.flag?.toLowerCase()}`}></div>
            <button className="dropbtn text-sm font-medium text-gray-700">
              {currentLang?.name || lang?.toUpperCase()}
              &nbsp;<i className="fas fa-angle-down"></i>
            </button>
            <div className="dropdown-content">
              {languages?.map((language, i) => (
                <Link
                  onClick={() => handleLanguage(language)}
                  key={i + 1}
                  href="/"
                  locale={`${language.iso_code}`}
                >
                  <div className={`flot-l flag ${language?.flag?.toLowerCase()}`}></div>
                  {language?.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavbarPromo;
