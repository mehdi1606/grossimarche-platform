import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import { Button } from "@windmill/react-ui";
import { IoLogOutOutline } from "react-icons/io5";
import { FiChevronsLeft, FiShoppingBag } from "react-icons/fi";

//internal import
import sidebar from "@/routes/sidebar";
import { AdminContext } from "@/context/AdminContext";
import SidebarSubMenu from "@/components/sidebar/SidebarSubMenu";
import useGetCData from "@/hooks/useGetCData";

const SidebarContent = ({ onToggle }) => {
  const { t } = useTranslation();
  const { dispatch } = useContext(AdminContext);
  const { accessList } = useGetCData();

  const handleLogOut = () => {
    dispatch({ type: "USER_LOGOUT" });
    Cookies.remove("adminInfo");
  };

  const updatedSidebar = sidebar
    .map((route) => {
      if (route.routes) {
        const validSubRoutes = route.routes.filter((subRoute) => {
          const routeKey = subRoute.path.split("?")[0].split("/")[1];
          return accessList.includes(routeKey);
        });
        if (validSubRoutes.length > 0) {
          return { ...route, routes: validSubRoutes };
        }
        return null;
      }
      const routeKey = route.path?.split("?")[0].split("/")[1];
      return routeKey && accessList.includes(routeKey) ? route : null;
    })
    .filter(Boolean);

  return (
    <div className="flex h-full min-h-screen flex-col py-5 text-gray-500 dark:text-gray-400">
      {/* Brand + collapse toggle (the toggle only exists on the desktop rail, where
          onToggle is passed; the mobile drawer closes via its backdrop). */}
      <div className="flex items-center justify-between gap-2 px-6">
        <a href="/dashboard" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
            <FiShoppingBag className="text-lg" />
          </span>
          <span className="font-serif text-lg font-bold tracking-tight text-gray-800 dark:text-gray-100">
            Grossi<span className="text-emerald-500">marché</span>
          </span>
        </a>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse menu"
            title="Collapse menu"
            className="-mr-1 shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-700 dark:hover:text-emerald-400"
          >
            <FiChevronsLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      <ul className="mt-8 flex-1 space-y-1 px-3">
        {updatedSidebar?.map((route) =>
          route.routes ? (
            <SidebarSubMenu route={route} key={route.name} />
          ) : (
            <li key={route.name}>
              <NavLink
                exact
                to={route.path}
                target={`${route?.outside ? "_blank" : "_self"}`}
                className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-gray-700/50 dark:hover:text-gray-100"
                activeClassName="bg-emerald-50 text-emerald-700 font-semibold shadow-sm dark:bg-emerald-500/10 dark:text-emerald-400"
                rel="noreferrer"
              >
                <route.icon
                  className="h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-110"
                  aria-hidden="true"
                />
                <span>{t(`${route.name}`)}</span>
              </NavLink>
            </li>
          )
        )}
      </ul>

      <div className="mt-4 px-4">
        <Button
          onClick={handleLogOut}
          size="large"
          layout="outline"
          className="w-full rounded-xl"
        >
          <span className="flex items-center">
            <IoLogOutOutline className="mr-3 text-lg" />
            <span className="text-sm">{t("LogOut")}</span>
          </span>
        </Button>
      </div>
    </div>
  );
};

export default SidebarContent;
