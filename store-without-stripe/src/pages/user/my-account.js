import Link from "next/link";
import React from "react";
import { FiEdit2, FiMapPin, FiPlus, FiUser } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

//internal imports
import { getUserSession } from "@lib/auth";
import Dashboard from "@pages/user/dashboard";
import CustomerServices from "@services/CustomerServices";

const MyAccount = () => {
  const userInfo = getUserSession();

  const { data } = useQuery({
    queryKey: ["shippingAddress", { id: userInfo?.id }],
    queryFn: async () => await CustomerServices.getShippingAddress(),
    enabled: !!userInfo?.id,
  });

  const address = Array.isArray(data) ? data[0] : null;

  return (
    <Dashboard title="Mon compte" description="Espace client Grossimarché">
      <h2 className="mb-6 font-serif text-xl font-semibold text-gray-800">Mon compte</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Profile card */}
        <div className="relative rounded-2xl border border-gray-100 p-5">
          <Link
            href="/user/update-profile"
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
          >
            <FiEdit2 /> Modifier
          </Link>
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-2xl font-bold text-white">
              {(userInfo?.name || userInfo?.email || "?").charAt(0).toUpperCase()}
            </span>
            <div>
              <h5 className="text-base font-semibold text-gray-800">
                {userInfo?.name || "Client"}
              </h5>
              <p className="text-sm text-gray-500">{userInfo?.email}</p>
              <p className="text-sm text-gray-500">{userInfo?.phone}</p>
            </div>
          </div>
        </div>

        {/* Address card */}
        {address ? (
          <div className="relative rounded-2xl border border-gray-100 p-5">
            <Link
              href="/user/add-shipping-address"
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
            >
              <FiEdit2 /> Modifier
            </Link>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-500">
                <FiMapPin />
              </span>
              <div>
                <h5 className="text-base font-semibold text-gray-800">
                  Adresse de livraison
                </h5>
                <p className="mt-1 text-sm text-gray-500">{address.addressLine}</p>
                <p className="text-sm text-gray-500">{address.city}</p>
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/user/add-shipping-address"
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 p-5 text-sm font-medium text-gray-600 transition hover:border-emerald-300 hover:text-emerald-600"
          >
            <FiPlus className="text-lg" /> Ajouter une adresse de livraison
          </Link>
        )}
      </div>
    </Dashboard>
  );
};

export default MyAccount;
