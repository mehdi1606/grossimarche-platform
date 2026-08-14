import Cookies from "js-cookie";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useEffect } from "react";
import { IoLogOutOutline } from "react-icons/io5";
import {
  FiCheck,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiSettings,
  FiShoppingCart,
  FiTruck,
  FiUser,
} from "react-icons/fi";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

//internal import
import Layout from "@layout/Layout";
import Card from "@components/order-card/Card";
import { getUserSession } from "@lib/auth";
import OrderServices from "@services/OrderServices";
import RecentOrder from "@pages/user/recent-order";
import { SidebarContext } from "@context/SidebarContext";
import Loading from "@components/preloader/Loading";

const SIDEBAR = [
  { title: "Tableau de bord", href: "/user/dashboard", icon: FiGrid },
  { title: "Mes commandes", href: "/user/my-orders", icon: FiList },
  { title: "Mon compte", href: "/user/my-account", icon: FiUser },
  { title: "Modifier le profil", href: "/user/update-profile", icon: FiSettings },
];

const Dashboard = ({ title, description, children }) => {
  const router = useRouter();
  const { isLoading, setIsLoading, currentPage } = useContext(SidebarContext);
  const userInfo = getUserSession();

  const {
    data,
    error,
    isLoading: loading,
  } = useQuery({
    queryKey: ["orders", { currentPage }],
    queryFn: async () =>
      await OrderServices.getOrderCustomer({ page: currentPage, limit: 10 }),
  });

  const handleLogOut = () => {
    signOut();
    Cookies.remove("couponInfo");
    router.push("/");
  };

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <>
      {isLoading ? (
        <Loading loading={isLoading} />
      ) : (
        <Layout
          title={title ? title : "Mon compte"}
          description={description ? description : "Espace client Grossimarché"}
        >
          <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
            <div className="flex w-full flex-col py-10 lg:flex-row lg:py-12">
              {/* Sidebar */}
              <div className="w-full flex-shrink-0 lg:mr-8 lg:w-72">
                <div className="sticky top-32 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  {/* user */}
                  <div className="mb-4 flex items-center gap-3 border-b border-gray-100 px-2 pb-4">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 text-lg font-bold text-white">
                      {(userInfo?.name || userInfo?.email || "?").charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {userInfo?.name || "Client"}
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        {userInfo?.email || userInfo?.phone}
                      </p>
                    </div>
                  </div>

                  <nav className="space-y-1">
                    {SIDEBAR.map((item) => {
                      const active = router.asPath.split("?")[0] === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                            active
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-gray-600 hover:bg-gray-50 hover:text-emerald-600"
                          }`}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.title}
                        </Link>
                      );
                    })}
                    <button
                      onClick={handleLogOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <IoLogOutOutline className="h-4 w-4 shrink-0" />
                      Se déconnecter
                    </button>
                  </nav>
                </div>
              </div>

              {/* Content */}
              <div className="mt-4 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:mt-0 lg:p-8">
                {!children && (
                  <div className="overflow-hidden">
                    <h2 className="mb-6 font-serif text-xl font-semibold text-gray-800">
                      Bonjour {userInfo?.name || "Client"} 👋
                    </h2>
                    <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Card
                        title="Commandes totales"
                        Icon={FiShoppingCart}
                        quantity={data?.totalDoc || 0}
                        className="text-emerald-600 bg-emerald-100"
                      />
                      <Card
                        title="En attente"
                        Icon={FiRefreshCw}
                        quantity={data?.pending || 0}
                        className="text-orange-600 bg-orange-100"
                      />
                      <Card
                        title="En préparation"
                        Icon={FiTruck}
                        quantity={data?.processing || 0}
                        className="text-indigo-600 bg-indigo-100"
                      />
                      <Card
                        title="Livrées"
                        Icon={FiCheck}
                        quantity={data?.delivered || 0}
                        className="text-emerald-600 bg-emerald-100"
                      />
                    </div>
                    <RecentOrder data={data} loading={loading} error={error} />
                  </div>
                )}
                {children}
              </div>
            </div>
          </div>
        </Layout>
      )}
    </>
  );
};

export default dynamic(() => Promise.resolve(Dashboard), { ssr: false });
