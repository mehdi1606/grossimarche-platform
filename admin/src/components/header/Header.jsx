import { Avatar, Badge, WindmillContext } from "@windmill/react-ui";
import Cookies from "js-cookie";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";

import {
  FiTrash2,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiSun,
  FiMoon,
  FiAlertTriangle,
  FiBell,
  FiSettings,
  FiShoppingBag,
  FiUserPlus,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import cookies from "js-cookie";
import { useTranslation } from "react-i18next";

//internal import
import ellipse from "@/assets/img/icons/ellipse.svg";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import useNotification, {
  isNotificationSoundEnabled,
  playNotificationChime,
  setNotificationSoundEnabled,
} from "@/hooks/useNotification";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import NotFoundTwo from "@/components/table/NotFoundTwo";
import NotificationServices from "@/services/NotificationServices";
import LanguageMenu from "@/components/header/LanguageMenu";
import { notifyError } from "@/utils/toast";

const Header = () => {
  const { toggleSidebar } =
    useContext(SidebarContext);
  const { state, dispatch } = useContext(AdminContext);
  const { adminInfo } = state;
  const { mode, toggleMode } = useContext(WindmillContext);
  const pRef = useRef();
  const nRef = useRef();

  const currentLanguageCode = cookies.get("i18next") || "en";
  const { t } = useTranslation();
  const { updated, setUpdated } = useNotification();
  const { showDateTimeFormat } = useUtilsFunction();

  const [data, setData] = useState([]);
  const [totalDoc, setTotalDoc] = useState(0);
  const [totalUnreadDoc, setTotalUnreadDoc] = useState(0);
  // Read once on mount: the preference lives in localStorage, which is not available during
  // the first render on the server-rendered path.
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    setSoundOn(isNotificationSoundEnabled());
  }, []);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // console.log("currentLanguageCode", currentLanguageCode);

  const handleLogOut = () => {
    dispatch({ type: "USER_LOGOUT" });
    Cookies.remove("adminInfo");
    window.location.replace(`${import.meta.env.VITE_APP_ADMIN_DOMAIN}/login`);
  };

  const handleNotificationOpen = async () => {
    setNotificationOpen(!notificationOpen);
    setProfileOpen(false);
    await handleGetAllNotifications();
  };
  const handleProfileOpen = () => {
    setProfileOpen(!profileOpen);
    setNotificationOpen(false);
  };

  // handle notification status change
  const handleNotificationStatusChange = async (id) => {
    try {
      await NotificationServices.updateStatusNotification(id);
      await handleGetAllNotifications();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  // handle notification delete
  const handleNotificationDelete = async (id) => {
    try {
      await NotificationServices.deleteNotification(id);
      await handleGetAllNotifications();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  //handle get notifications
  const handleGetAllNotifications = async () => {
    try {
      const res = await NotificationServices.getAllNotifications(0, 10);
      const unread = await NotificationServices.getUnreadCount();
      setData(res?.notifications);
      setTotalUnreadDoc(unread);
      setTotalDoc(res?.totalDoc);
      setUpdated(false);
    } catch (err) {
      setUpdated(false);
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!pRef?.current?.contains(e.target)) {
        setProfileOpen(false);
      }
      if (!nRef?.current?.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
  }, [pRef, nRef]);

  // notification api calling
  useEffect(() => {
    handleGetAllNotifications();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updated]);
  // const onChange = (event) => {
  //     i18next.changeLanguage(event.target.value);

  // }

  // console.log("notificaiotn", data);
  return (
    <>
      <header className="z-30 py-4 bg-white shadow-sm dark:bg-gray-800">
        <div className="container flex items-center justify-between h-full px-6 mx-auto text-emerald-500 dark:text-emerald-500">
          {/* The desktop collapse toggle lives in the sidebar itself, next to the logo. */}

          {/* <!-- Mobile hamburger --> */}
          <button
            className="p-1 mr-5 -ml-1 rounded-md lg:hidden focus:outline-none"
            onClick={toggleSidebar}
            aria-label="Menu"
          >
            <FiMenu className="w-6 h-6" aria-hidden="true" />
          </button>
          <span></span>

          <ul className="flex justify-end items-center flex-shrink-0 space-x-6">
            <li className="flex">
              <LanguageMenu />
            </li>

            {/* <!-- Theme toggler --> */}

            <li className="flex">
              <button
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700"
                onClick={toggleMode}
                aria-label="Toggle color mode"
              >
                {mode === "dark" ? (
                  <FiSun className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <FiMoon className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </li>

            {/* <!-- Notifications menu --> */}
            <li className="relative inline-block text-left" ref={nRef}>
              <button
                className="relative rounded-full p-2 text-gray-500 transition hover:bg-gray-100 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700"
                onClick={handleNotificationOpen}
              >
                <FiBell className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                {totalUnreadDoc > 0 && (
                  <span className="absolute right-0.5 top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-gray-800">
                    {totalUnreadDoc}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="origin-top-right absolute md:right-0 -right-3 top-full mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl focus:outline-none dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      Notifications
                    </span>
                    <div className="flex items-center gap-2">
                      {totalUnreadDoc > 0 && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10">
                          {totalUnreadDoc} new
                        </span>
                      )}
                      {/* The chime can be turned off without leaving the panel it rings for. */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = !soundOn;
                          setNotificationSoundEnabled(next);
                          setSoundOn(next);
                          // Play it once when switching on, so the setting is verifiable
                          // without waiting for a real notification to arrive.
                          if (next) playNotificationChime();
                        }}
                        title={soundOn ? "Couper le son" : "Activer le son"}
                        aria-label={soundOn ? "Couper le son" : "Activer le son"}
                        className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-700"
                      >
                        {soundOn ? (
                          <FiVolume2 className="h-4 w-4" />
                        ) : (
                          <FiVolumeX className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div
                    className={`${
                      data?.length === 0
                        ? "h-40"
                        : data?.length <= 2
                        ? "h-40"
                        : data?.length <= 3
                        ? "h-56"
                        : "h-330"
                    } md:w-400 w-300`}
                  >
                    <Scrollbars>
                      {data?.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
                          <span className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10">
                            <FiBell className="text-xl" />
                          </span>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            You&apos;re all caught up
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            New orders and low-stock alerts show up here.
                          </p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                          {data?.map((value, index) => {
                            /* Type drives the icon, the colour and the destination. The row
                               used to guess from the presence of a productId, so a customer
                               sign-up was labelled "Stock Out" and pointed at a product that
                               does not exist - which is exactly what a NEW_CUSTOMER row showed. */
                            const kind =
                              value.type === "NEW_ORDER"
                                ? {
                                    Icon: FiShoppingBag,
                                    chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
                                    to: value.orderId ? `/order/${value.orderId}` : "/orders",
                                  }
                                : value.type === "NEW_CUSTOMER"
                                ? {
                                    Icon: FiUserPlus,
                                    chip: "bg-blue-50 text-blue-600 dark:bg-blue-500/10",
                                    to: "/approvals",
                                  }
                                : value.type === "LOW_STOCK"
                                ? {
                                    Icon: FiAlertTriangle,
                                    chip: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
                                    to: value.productId
                                      ? `/product/${value.productId}`
                                      : "/products",
                                  }
                                : {
                                    Icon: FiBell,
                                    chip: "bg-gray-100 text-gray-500 dark:bg-gray-700",
                                    to: "/notifications",
                                  };

                            return (
                              <li
                                key={index + 1}
                                className={`group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40 ${
                                  value.status === "unread"
                                    ? "bg-emerald-50/40 dark:bg-emerald-500/5"
                                    : ""
                                }`}
                              >
                                <Link
                                  to={kind.to}
                                  onClick={() => {
                                    handleNotificationStatusChange(value._id);
                                    setNotificationOpen(false);
                                  }}
                                  className="flex min-w-0 flex-1 items-start gap-3"
                                >
                                  <span
                                    className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${kind.chip}`}
                                  >
                                    <kind.Icon className="h-4 w-4" />
                                  </span>

                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                      <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                                        {value.title}
                                      </span>
                                      {value.status === "unread" && (
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                      )}
                                    </span>
                                    <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                      {value.message}
                                    </span>
                                    <span className="mt-1 block text-[11px] text-gray-400">
                                      {showDateTimeFormat(value.createdAt)}
                                    </span>
                                  </span>
                                </Link>

                                {/* Deleting is a corner action: an icon that appears on hover,
                                    not a red "Delete" label competing with the message. */}
                                <button
                                  type="button"
                                  title="Supprimer"
                                  aria-label="Supprimer la notification"
                                  onClick={() => handleNotificationDelete(value._id)}
                                  className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-red-500/10"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {totalDoc > 5 && (
                        <div className="text-center py-2">
                          <Link
                            onClick={() => setNotificationOpen(false)}
                            to={"/notifications"}
                            className="focus:outline-none hover:underline transition ease-out duration-200"
                          >
                            Show all notifications
                          </Link>
                        </div>
                      )}
                    </Scrollbars>
                  </div>
                </div>
              )}
            </li>

            {/* <!-- Profile menu --> */}
            <li className="relative inline-block text-left" ref={pRef}>
              <button
                className="rounded-full dark:bg-gray-500 bg-emerald-500 text-white h-8 w-8 font-medium mx-auto focus:outline-none"
                onClick={handleProfileOpen}
              >
                {adminInfo.image ? (
                  <Avatar
                    className="align-middle"
                    src={`${adminInfo.image}`}
                    aria-hidden="true"
                  />
                ) : (
                  <span>
                    {(adminInfo?.name || adminInfo?.email || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </button>

              {profileOpen && (
                /* A profile menu that never says whose profile it is. The panel now opens on
                   the signed-in identity, then the actions - and signing out is separated
                   from navigation, because it is not the same kind of click. */
                <div className="absolute right-0 z-30 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
                      {(adminInfo?.name || adminInfo?.email || "?").charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {adminInfo?.name || "Staff"}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {adminInfo?.email || adminInfo?.phone || ""}
                      </p>
                    </div>
                  </div>

                  <ul className="py-1">
                    <li>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-emerald-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-emerald-400"
                      >
                        <FiGrid className="h-4 w-4 shrink-0" aria-hidden="true" />
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/edit-profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-emerald-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-emerald-400"
                      >
                        <FiSettings className="h-4 w-4 shrink-0" aria-hidden="true" />
                        Mon profil
                      </Link>
                    </li>
                  </ul>

                  <div className="border-t border-gray-100 py-1 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={handleLogOut}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <FiLogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </li>
          </ul>
        </div>
      </header>
    </>
  );
};

export default Header;
