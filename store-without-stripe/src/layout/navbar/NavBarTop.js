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
    <div className="hidden border-b border-line bg-cream lg:block">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-10">
        <div className="flex items-center justify-between py-2 font-sans text-xs font-medium text-ink-500">
          {/* Left: contact */}
          <div className="flex items-center gap-5">
            <a
              href="tel:+2125220000000"
              data-no-translate
              className="flex items-center transition hover:text-emerald-700"
            >
              <FiPhoneCall className="mr-1.5" />
              +212 5 22 00 00 00
            </a>
            <a
              href="mailto:contact@grossimarche.ma"
              data-no-translate
              className="hidden items-center transition hover:text-emerald-700 xl:flex"
            >
              <FiMail className="mr-1.5" />
              contact@grossimarche.ma
            </a>
          </div>

          {/* Right: account */}
          <div className="flex items-center gap-4">
            <span className="hidden text-ink-400 xl:inline">
              Livraison partout au Maroc - Paiement à la livraison
            </span>
            {userInfo?.email ? (
              <>
                <Link
                  href="/user/dashboard"
                  className="flex items-center font-medium transition hover:text-emerald-700"
                >
                  <FiUser className="mr-1" />
                  Mon compte
                </Link>
                <span className="text-line">|</span>
                <button
                  onClick={handleLogOut}
                  className="flex items-center font-medium transition hover:text-emerald-700"
                >
                  <IoLockOpenOutline className="mr-1" />
                  Se déconnecter
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center font-medium transition hover:text-emerald-700"
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
