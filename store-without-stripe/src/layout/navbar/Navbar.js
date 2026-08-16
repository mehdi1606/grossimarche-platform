import { useContext, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCart } from "react-use-cart";
import { IoSearchOutline } from "react-icons/io5";
import { FiShoppingCart, FiUser, FiBell } from "react-icons/fi";
import useTranslation from "next-translate/useTranslation";

//internal import
import { getUserSession } from "@lib/auth";
import useGetSetting from "@hooks/useGetSetting";
import { handleLogEvent } from "src/lib/analytics";
import NavbarPromo from "@layout/navbar/NavbarPromo";
import CartDrawer from "@components/drawer/CartDrawer";
import { SidebarContext } from "@context/SidebarContext";

const Navbar = () => {
  const { t, lang } = useTranslation("common");
  const [searchText, setSearchText] = useState("");
  const { toggleCartDrawer } = useContext(SidebarContext);
  const { totalItems } = useCart();
  const router = useRouter();

  const userInfo = getUserSession();

  const { storeCustomizationSetting } = useGetSetting();

  // console.log("storeCustomizationSetting", storeCustomizationSetting);

  // console.log("t", t, "lang::::", lang);

  const handleSubmit = (e) => {
    e.preventDefault();

    // return;
    if (searchText) {
      router.push(`/search?query=${searchText}`, null, { scroll: false });
      setSearchText("");
      handleLogEvent("search", `searched ${searchText}`);
    } else {
      router.push(`/ `, null, { scroll: false });
      setSearchText("");
    }
  };

  // console.log(
  //   "storeCustomizationSetting?.navbar?.header_logo",
  //   storeCustomizationSetting?.navbar?.logo
  // );

  return (
    <>
      <CartDrawer />
      <div className="bg-emerald-500 sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-10">
          <div className="top-bar h-16 lg:h-auto flex items-center justify-between py-4 mx-auto">
            <Link
              href="/"
              aria-label="Grossimarché"
              className="mr-3 lg:mr-12 xl:mr-12 hidden shrink-0 items-center gap-2 lg:flex"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <FiShoppingCart className="h-5 w-5" />
              </span>
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                Grossi<span className="text-emerald-100">marché</span>
              </span>
            </Link>
            <div className="w-full transition-all duration-200 ease-in-out lg:flex lg:max-w-[520px] xl:max-w-[750px] 2xl:max-w-[900px] md:mx-12 lg:mx-4 xl:mx-0">
              <div className="w-full flex flex-col justify-center flex-shrink-0 relative z-30">
                <div className="flex flex-col mx-auto w-full">
                  <form
                    onSubmit={handleSubmit}
                    className="relative pr-12 md:pr-14 bg-white overflow-hidden shadow-sm rounded-md w-full"
                  >
                    <label className="flex items-center py-0.5">
                      <input
                        onChange={(e) => setSearchText(e.target.value)}
                        value={searchText}
                        className="form-input w-full pl-5 appearance-none transition ease-in-out border text-input text-sm font-sans rounded-md min-h-10 h-10 duration-200 bg-white focus:ring-0 outline-none border-none focus:outline-none placeholder-gray-500 placeholder-opacity-75"
                        placeholder="Rechercher un produit, une marque…"
                      />
                    </label>
                    <button
                      aria-label="Search"
                      type="submit"
                      className="outline-none text-xl text-gray-400 absolute top-0 right-0 end-0 w-12 md:w-14 h-full flex items-center justify-center transition duration-200 ease-in-out hover:text-heading focus:outline-none"
                    >
                      <IoSearchOutline />
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-1 lg:flex sm:ml-6">
              {/* Cart */}
              <button
                aria-label="Panier"
                onClick={toggleCartDrawer}
                className="relative grid h-10 w-10 place-items-center rounded-full text-white transition hover:bg-white/10"
              >
                <FiShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute right-0.5 top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-emerald-500">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Account */}
              {userInfo ? (
                // Logged in — always go to the account area, regardless of whether a name or
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
