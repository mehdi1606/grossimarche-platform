import React from "react";

/**
 * Circular gradient-ring spinner (2026 UI). Use for in-modal / button / section loading.
 * The `.gm-ring` styles live in assets/css/custom.css.
 */
const Loader = ({ label, className = "" }) => (
  <div className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`}>
    <span className="gm-ring" aria-hidden="true" />
    {label && <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>}
  </div>
);

export default Loader;
