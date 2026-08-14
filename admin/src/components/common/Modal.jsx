import React, { useEffect } from "react";
import { IoClose } from "react-icons/io5";

/**
 * Premium, responsive modal (2026 UI). Overlay with blur, centered card that scales in,
 * Escape-to-close, body-scroll lock. Slides up from the bottom on mobile.
 *
 * Props: isOpen, onClose, title, subtitle, icon (react-icon), children, footer, size.
 */
const SIZES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  size = "md",
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="gm-overlay-in fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={`gm-modal-in flex max-h-[92vh] w-full ${SIZES[size]} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-gray-800 sm:rounded-2xl`}
        role="dialog"
        aria-modal="true"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10">
                <Icon className="text-lg" />
              </span>
            )}
            <div>
              <h3 className="font-serif text-lg font-semibold text-gray-800 dark:text-gray-100">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
