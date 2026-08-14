import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IoChevronDownOutline } from "react-icons/io5";

const SidebarSubMenu = ({ route }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);

  return (
    <li>
      <button
        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none dark:hover:bg-gray-700/50 dark:hover:text-gray-100"
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
      >
        <span className="flex items-center gap-3">
          <route.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{t(`${route.name}`)}</span>
        </span>
        <IoChevronDownOutline
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="mt-1 space-y-0.5 pl-6" aria-label="submenu">
          {route.routes.map((child, i) => (
            <li key={i + 1}>
              {child?.outside ? (
                <a
                  href={import.meta.env.VITE_APP_STORE_DOMAIN}
                  target="_blank"
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-500 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-400 dark:hover:bg-gray-700/50"
                  rel="noreferrer"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                  {t(`${child.name}`)}
                </a>
              ) : (
                <NavLink
                  to={child.path}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-500 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-400 dark:hover:bg-gray-700/50"
                  activeClassName="bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-500/10 dark:text-emerald-400"
                  rel="noreferrer"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  {t(`${child.name}`)}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default SidebarSubMenu;
