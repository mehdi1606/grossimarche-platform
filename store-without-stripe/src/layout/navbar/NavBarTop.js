import Link from "next/link";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import dynamic from "next/dynamic";
import { IoLockOpenOutline } from "react-icons/io5";
import { FiPhoneCall, FiUser, FiMail } from "react-icons/fi";
import { signOut } from "next-auth/react";
import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";

//internal import
import { getUserSession } from "@lib/auth";

const NavBarTop = () => {
  const userInfo = getUserSession();
  const router = useRouter();

  const handleLogOut = () => {
    signOut();
    Cookies.remove("couponInfo");
    router.push("/");
  };

  useEffect(() => {
    if (userInfo?.token) {
      try {
        const decoded = jwtDecode(userInfo.token);
        if (new Date() >= new Date(decoded?.exp * 1000)) {
          handleLogOut();
        }
      } catch (e) {
        // ignore malformed token
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo]);

  return (
    <div className="hidden lg:block bg-gray-50 border-b border-gray-100">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-10">
        <div className="text-gray-600 py-2 font-sans text-xs font-medium flex justify-between items-center">
          {/* Left: contact */}
          <div className="flex items-center gap-5">
            <a
              href="tel:+2125220000000"
              className="flex items-center hover:text-emerald-600 transition"
            >
              <FiPhoneCall className="mr-1.5" />
              +212 5 22 00 00 00
            </a>
            <a
              href="mailto:contact@grossimarche.ma"
              className="hidden xl:flex items-center hover:text-emerald-600 transition"
            >
              <FiMail className="mr-1.5" />
              contact@grossimarche.ma
            </a>
          </div>

          {/* Right: account */}
          <div className="flex items-center gap-4">
            <span className="hidden xl:inline text-gray-400">
              Livraison partout au Maroc — Paiement à la livraison
            </span>
            {userInfo?.email ? (
              <>
                <Link
                  href="/user/dashboard"
                  className="flex items-center font-medium hover:text-emerald-600 transition"
                >
                  <FiUser className="mr-1" />
                  Mon compte
                </Link>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleLogOut}
                  className="flex items-center font-medium hover:text-emerald-600 transition"
                >
                  <IoLockOpenOutline className="mr-1" />
                  Se déconnecter
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center font-medium hover:text-emerald-600 transition"
              >
                <FiUser className="mr-1" />
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(NavBarTop), { ssr: false });
