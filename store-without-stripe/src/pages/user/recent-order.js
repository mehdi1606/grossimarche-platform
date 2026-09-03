import React from "react";
import Link from "next/link";
import { IoBagHandle } from "react-icons/io5";
import { FiArrowRight } from "react-icons/fi";

//internal import

import OrderCard from "@components/order/OrderCard";
import useUtilsFunction from "@hooks/useUtilsFunction";
import CMSkeletonTwo from "@components/preloader/CMSkeletonTwo";

/**
 * The dashboard's recent-orders block.
 *
 * Deliberately short - three cards and a link to the full history. Pagination belongs on
 * /user/my-orders, not on a dashboard summary that also shows four counters above it.
 */
const RecentOrder = ({ data, loading, error }) => {
  const { currency } = useUtilsFunction();
  const orders = (data?.orders || []).slice(0, 3);

  return (
    <div className="mx-auto max-w-screen-2xl">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h3 className="font-display text-lg font-semibold text-ink-900">
          Commandes récentes
        </h3>
        {orders.length > 0 && (
          <Link
            href="/user/my-orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 transition hover:underline"
          >
            Tout voir <FiArrowRight className="gm-dir-icon h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {loading ? (
        <CMSkeletonTwo count={12} width={100} error={error} loading={loading} />
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-2xl text-emerald-500">
            <IoBagHandle />
          </span>
          <h2 className="font-display text-base font-semibold text-ink-800">
            Vous n'avez pas encore de commande
          </h2>
          <p className="mt-1 max-w-sm text-sm text-ink-500">
            Parcourez le catalogue et passez votre première commande au prix de gros.
          </p>
          <Link
            href="/search"
            className="mt-5 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Découvrir les produits
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentOrder;
