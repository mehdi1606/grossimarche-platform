import { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCart } from "react-use-cart";
import { IoSearchOutline } from "react-icons/io5";
import { FiShoppingCart, FiUser } from "react-icons/fi";

//internal import
import { getUserSession } from "@lib/auth";
import useGetSetting from "@hooks/useGetSetting";
import { handleLogEvent } from "src/lib/analytics";
import NavbarPromo from "@layout/navbar/NavbarPromo";
import BrandMark from "@components/common/BrandMark";
import CartDrawer from "@components/drawer/CartDrawer";
import { SidebarContext } from "@context/SidebarContext";

const Navbar = () => {
  const [searchText, setSearchText] = useState("");
  const { toggleCartDrawer } = useContext(SidebarContext);
  const { totalItems } = useCart();
  const router = useRouter();

  const userInfo = getUserSession();

  const { storeCustomizationSetting } = useGetSetting();

  // The cart button is the *only* cart affordance on desktop now (the logo used to be the
  // same shopping-cart glyph, and a floating sticky cart duplicated it again on the home
  // page). Since there is one, it has to be expressive: the badge pops and the bag nudges
  // whenever the count changes, so an add from anywhere on the page is visibly acknowledged.
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (searchText) {
      router.push(`/search?query=${searchText}`, null, { scroll: false });
      setSearchText("");
      handleLogEvent("search", `searched ${searchText}`);
    } else {
      router.push(`/ `, null, { scroll: false });
      setSearchText("");
    }
  };

  return (
    <>
      <CartDrawer />
      <div className="sticky top-0 z-20 bg-emerald-700">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
          <div className="top-bar mx-auto flex h-16 items-center justify-between py-4 lg:h-auto">
            {/* On a phone the bar was the search field and nothing else - no brand anywhere
                above the fold. The monogram alone fits without crowding the field; the full
                wordmark returns once there is room for it. */}
            <BrandMark
              withWordmark={false}
              className="mr-3 shrink-0 lg:hidden"
            />
            <BrandMark className="mr-3 hidden shrink-0 lg:mr-12 lg:flex xl:mr-12" />

            <div className="w-full transition-all duration-200 ease-in-out md:mx-12 lg:mx-4 lg:flex lg:max-w-[520px] xl:mx-0 xl:max-w-[750px] 2xl:max-w-[900px]">
              <div className="relative z-30 flex w-full flex-shrink-0 flex-col justify-center">
                <div className="mx-auto flex w-full flex-col">
                  <form
                    onSubmit={handleSubmit}
                    className="relative w-full overflow-hidden rounded-xl bg-white pr-12 shadow-luxe md:pr-14"
                  >
                    <label className="flex items-center py-0.5">
                      <input
                        onChange={(e) => setSearchText(e.target.value)}
                        value={searchText}
                        className="form-input h-10 min-h-10 w-full appearance-none rounded-xl border-none bg-white pl-5 font-sans text-sm text-ink-800 outline-none transition duration-200 ease-in-out placeholder:text-ink-400 focus:outline-none focus:ring-0"
                        placeholder="Rechercher un produit, une marque…"
                      />
                    </label>
                    <button
                      aria-label="Rechercher"
                      type="submit"
                      className="absolute end-0 right-0 top-0 flex h-full w-12 items-center justify-center text-xl text-ink-400 outline-none transition duration-200 ease-in-out hover:text-emerald-700 focus:outline-none md:w-14"
                    >
                      <IoSearchOutline />
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-1 sm:ml-6 lg:flex">
              {/* Cart - the single desktop entry point */}
              <button
                aria-label={
                  totalItems > 0
                    ? `Panier, ${totalItems} article(s)`
                    : "Panier, vide"
                }
                onClick={toggleCartDrawer}
                className="relative grid h-10 w-10 place-items-center rounded-full text-white transition hover:bg-white/10"
              >
                <FiShoppingCart
                  className={`h-6 w-6 ${bump ? "animate-cart-nudge" : ""}`}
                />
                {totalItems > 0 && (
                  <span
                    className={`absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brass-400 px-1 text-2xs font-bold leading-none tabular-nums text-emerald-900 ring-2 ring-emerald-700 ${
                      bump ? "animate-badge-pop" : ""
                    }`}
                  >
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Account */}
              {userInfo ? (
                // Logged in - always go to the account area, regardless of whether a name or
                // photo has been set (phone/email sign-ups start with neither).
                <Link
                  href="/user/dashboard"
                  aria-label="Mon compte"
                  className="grid h-10 w-10 place-items-center rounded-full text-white transition hover:bg-white/10"
                >
                  {userInfo?.image ? (
                    <Image
                      width={28}
                      height={28}
                      src={userInfo.image}
                      alt="user"
                      className="rounded-full bg-white"
                    />
                  ) : userInfo?.name ? (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-sm font-bold uppercase">
                      {userInfo.name[0]}
                    </span>
                  ) : (
                    <FiUser className="h-6 w-6" />
                  )}
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  aria-label="Se connecter"
                  className="grid h-10 w-10 place-items-center rounded-full text-white transition hover:bg-white/10"
                >
                  <FiUser className="h-6 w-6" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* second header */}
        <NavbarPromo />
      </div>
    </>
  );
};
export default dynamic(() => Promise.resolve(Navbar), { ssr: false });
