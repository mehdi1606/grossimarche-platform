import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

/**
 * Styled single-select, the storefront twin of the back-office one. A native <select> cannot
 * be themed — its option list is drawn by the OS, so it ignores the app's rounding, colours
 * and hover states. Click to open, closes on outside click or Escape.
 *
 * Props: options [{ value, label }], value, onChange(value), placeholder (the reset row,
 * always first, whose value is `resetValue`), ariaLabel, className (wrapper width).
 */
const FilterDropdown = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Tous",
  resetValue = "",
  ariaLabel,
  className = "",
}) => {
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

  const items = [{ value: resetValue, label: placeholder }, ...options];
  const selected = items.find((o) => o.value === value) || items[0];
  const isPlaceholder = selected.value === resetValue;

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
        className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-700 transition hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      >
        <span className={`truncate ${isPlaceholder ? "text-gray-500" : ""}`}>
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
          className="absolute right-0 z-30 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
        >
          {items.map((option) => {
            const isSelected = option.value === selected.value;
            return (
              <li key={option.value || "__reset__"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => pick(option.value)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? "bg-emerald-50 font-medium text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50"
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
