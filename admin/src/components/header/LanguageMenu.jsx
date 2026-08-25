import React, { useContext, useEffect, useRef, useState } from "react";
import { FiCheck, FiGlobe } from "react-icons/fi";

//internal import
import { SidebarContext } from "@/context/SidebarContext";
import useUtilsFunction from "@/hooks/useUtilsFunction";

/**
 * Header language switcher. Replaces the old CSS hover dropdown, which had a hardcoded
 * white panel (no dark mode), square corners and flags pulled from a third-party sprite on
 * raw.githubusercontent.com - an external asset that often failed to load, leaving blank
 * rows. Here the ISO code stands in for the flag: it always renders and needs no network.
 *
 * Same panel styling as FilterDropdown: click to open, closes on outside click or Escape.
 */
const LanguageMenu = () => {
  const { currLang, handleLanguageChange } = useContext(SidebarContext);
  const { languages } = useUtilsFunction();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

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

  // Falls back to the current language so the menu is never empty while the list loads.
  const items = languages?.length ? languages : currLang ? [currLang] : [];

  const pick = (lang) => {
    setOpen(false);
    if (lang?.iso_code !== currLang?.iso_code) handleLanguageChange(lang);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Icon-only trigger, same shape as the theme and notification buttons next to it.
          The current language is announced through the label/tooltip and marked in the list. */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change language (${currLang?.name || ""})`}
        title={currLang?.name}
        className={`rounded-full p-2 transition-colors focus:outline-none ${
          open
            ? "bg-gray-100 text-emerald-600 dark:bg-gray-700 dark:text-emerald-400"
            : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        }`}
      >
        <FiGlobe className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800 dark:ring-black/40"
        >
          {items.map((lang) => {
            const isActive = lang?.iso_code === currLang?.iso_code;
            return (
              <li key={lang?._id || lang?.iso_code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => pick(lang)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-emerald-50 font-medium text-emerald-700 dark:bg-gray-700 dark:text-emerald-400"
                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <span
                    className={`grid h-6 w-8 shrink-0 place-items-center rounded-md text-[11px] font-semibold uppercase tracking-wide ${
                      isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {lang?.iso_code}
                  </span>
                  <span className="flex-1 truncate" dir="auto">
                    {lang?.name}
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
