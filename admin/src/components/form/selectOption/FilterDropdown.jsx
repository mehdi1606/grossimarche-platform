import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

/**
 * Styled single-select for the list filters. A native <select> is not themable - its option
 * list is drawn by the OS, so it ignores the dark mode and the app's rounding/colours. The
 * panel is therefore rendered here: same height and border as the search field, closes on
 * outside click or Escape, and marks the current choice.
 *
 * Props: options [{ value, label }], value, onChange(value), allLabel (the "no filter"
 * entry, always first), ariaLabel, className (width/layout of the wrapper), placement
 * ("top" opens upward - needed when the trigger sits in a modal footer, where a downward
 * panel would be clipped by the dialog's overflow).
 */
const FilterDropdown = ({
  options = [],
  value = "",
  onChange,
  allLabel = "Tous",
  ariaLabel,
  className = "",
  placement = "bottom",
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const items = [{ value: "", label: allLabel }, ...options];
  const selected = items.find((o) => o.value === value) || items[0];

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

  const pick = (next) => {
    setOpen(false);
    if (next !== value) onChange?.(next);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
      >
        <span className={`truncate ${value ? "" : "text-gray-500 dark:text-gray-400"}`}>
          {selected.label}
        </span>
        <FiChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={`gm-thin-scroll absolute left-0 right-0 z-20 max-h-72 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800 dark:ring-black/40 ${
            placement === "top" ? "bottom-full mb-2" : "mt-2"
          }`}
        >
          {items.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value || "__all__"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => pick(option.value)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-emerald-50 font-medium text-emerald-700 dark:bg-gray-700 dark:text-emerald-400"
                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <FiCheck className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FilterDropdown;
