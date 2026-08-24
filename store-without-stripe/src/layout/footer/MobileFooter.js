import React, { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCart } from "react-use-cart";
import { FiHome, FiUser, FiShoppingCart, FiAlignLeft } from "react-icons/fi";

//internal imports
import { getUserSession } from "@lib/auth";
import { SidebarContext } from "@context/SidebarContext";
import CategoryDrawer from "@components/drawer/CategoryDrawer";

const MobileFooter = () => {
  const { toggleCartDrawer, toggleCategoryDrawer } = useContext(SidebarContext);
  const { totalItems } = useCart();
  const userInfo = getUserSession();

  // Same badge behaviour as the desktop navbar — and, unlike before, the badge is hidden
  // entirely at zero instead of displaying a permanent "0".
  const [bump, setBump] = useState(false);
  const previousCount = useRef(totalItems);

  useEffect(() => {
    if (totalItems === previousCount.current) return undefined;
    previousCount.current = totalItems;
    if (totalItems === 0) return undefined;
    setBump(true);
    const timer = setTimeout(() => setBump(false), 500);
    return () => clearTimeout(timer);
  }, [totalItems]);

  return (
    <>
      <div className="flex h-full w-full flex-grow cursor-pointer flex-col justify-between overflow-y-scroll rounded bg-white align-middle scrollbar-hide">
        <CategoryDrawer className="h-6 w-6 drop-shadow-xl" />
      </div>
      <footer className="fixed bottom-0 z-30 flex h-16 w-full items-center justify-between border-t border-emerald-800/40 bg-emerald-700 px-3 sm:px-10 lg:hidden">
        <button
          aria-label="Catégories"
          onClick={toggleCategoryDrawer}
          className="relative flex h-auto flex-shrink-0 items-center justify-center focus:outline-none"
        >
          <span className="text-xl text-white">
            <FiAlignLeft className="h-6 w-6" />
          </span>
        </button>
        <Link
          href="/"
          className="text-xl text-white"
          rel="noreferrer"
          aria-label="Accueil"
        >
          <FiHome className="h-6 w-6" />
        </Link>

        <button
          onClick={toggleCartDrawer}
          aria-label={
            totalItems > 0 ? `Panier, ${totalItems} article(s)` : "Panier, vide"
          }
          className="relative inline-flex h-9 w-9 items-center justify-center whitespace-nowrap text-lg text-white"
        >
          {totalItems > 0 && (
            <span
              className={`absolute right-0 top-0 z-10 grid h-[18px] min-w-[18px] translate-x-1/2 place-items-center rounded-full bg-brass-400 px-1 text-2xs font-bold leading-none tabular-nums text-emerald-900 ${
                bump ? "animate-badge-pop" : ""
              }`}
            >
              {totalItems}
            </span>
          )}
          <FiShoppingCart
            className={`h-6 w-6 ${bump ? "animate-cart-nudge" : ""}`}
          />
        </button>
        {userInfo?.image ? (
          <Link
            href="/user/dashboard"
            aria-label="Mon compte"
            className="grid h-9 w-9 place-items-center text-white"
          >
            <Image
              width={28}
              height={28}
              src={userInfo.image}
              alt="user"
              className="rounded-full"
            />
          </Link>
        ) : userInfo?.name ? (
          <Link
            href="/user/dashboard"
            aria-label="Mon compte"
            className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold uppercase leading-none text-white"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20">
              {userInfo.name[0]}
            </span>
          </Link>
        ) : (
          <Link
            href={userInfo ? "/user/dashboard" : "/auth/login"}
            aria-label={userInfo ? "Mon compte" : "Se connecter"}
            className="grid h-9 w-9 place-items-center text-white"
          >
            <FiUser className="h-6 w-6" />
          </Link>
        )}
      </footer>
    </>
  );
};

export default dynamic(() => Promise.resolve(MobileFooter), { ssr: false });
