import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { FiCheck, FiGlobe } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

//internal import
import SettingServices from "@services/SettingServices";
import cookieOptions from "@utils/cookieOptions";

/**
 * Storefront language switcher, same shape as the back-office one: a globe button that opens
 * a panel listing each language with its ISO badge and a check on the active one.
 *
 * The list is filtered against the locales Next actually routes (`i18n.locales` in
 * next.config.js). The API can advertise a language the site does not route, and offering it
 * would push the visitor to a URL that does not exist.
 *
 * There is no per-language translation work behind a locale: picking one switches the route,
 * and TranslationContext machine-translates the page from French. Adding a language is a
 * one-line change in next.config.js.
 */
const LanguageMenu = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const { data: languages } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => await SettingServices.getShowingLanguage(),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const routable = (languages || []).filter((l) =>
    (router.locales || []).includes(l?.iso_code)
  );

  if (routable.length < 2) return null;

  const current =
    routable.find((l) => l.iso_code === router.locale) || routable[0];

  const pick = (language) => {
    setOpen(false);
    if (language.iso_code === router.locale) return;
    Cookies.set("_lang", language.iso_code, cookieOptions());
    Cookies.set("_curr_lang", JSON.stringify(language), cookieOptions());
    // Stay on the current page instead of bouncing to the home page.
    router.push(router.asPath, router.asPath, { locale: language.iso_code });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Changer de langue (${current?.name || ""})`}
        title={current?.name}
        className={`grid h-9 w-9 place-items-center rounded-full transition-colors focus:outline-none ${
          open
            ? "bg-sand text-emerald-700"
            : "text-ink-500 hover:bg-sand hover:text-emerald-700"
        }`}
      >
        <FiGlobe className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Langue"
          className="absolute end-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-luxe-lg"
        >
          {routable.map((language) => {
            const isActive = language.iso_code === current?.iso_code;
            return (
              <li key={language._id || language.iso_code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => pick(language)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-start text-sm transition-colors ${
                    isActive
                      ? "bg-emerald-50 font-medium text-emerald-800"
                      : "text-ink-600 hover:bg-sand"
                  }`}
                >
                  <span
                    data-no-translate
                    className={`grid h-6 w-8 shrink-0 place-items-center rounded-md text-[11px] font-semibold uppercase tracking-wide ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-sand text-ink-500"
                    }`}
                  >
                    {language.iso_code}
                  </span>
                  <span className="flex-1 truncate" dir="auto">
                    {language.name}
                  </span>
                  {isActive && <FiCheck className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LanguageMenu;
