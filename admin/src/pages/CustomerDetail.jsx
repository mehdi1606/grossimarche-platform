import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@windmill/react-ui";
import dayjs from "dayjs";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiChevronRight,
  FiInfo,
  FiMail,
  FiPhone,
  FiShoppingBag,
  FiSlash,
  FiTrendingUp,
} from "react-icons/fi";

//internal import
import Loader from "@/components/common/Loader";
import CustomerServices from "@/services/CustomerServices";
import EmptyState from "@/components/common/EmptyState";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@/utils/toast";
import { statusBadge, statusLabel } from "@/utils/orderStatus";

const Stat = ({ label, value, hint, icon: Icon }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </p>
        <p className="mt-2 font-serif text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
        <Icon className="h-4 w-4" />
      </span>
    </div>
  </div>
);

/**
 * One customer, on their own page.
 *
 * The dialog it replaces showed six figures and a Block button. For a wholesale account that is
 * the least interesting half: what matters is what they buy, how often, and at which prices -
 * and their orders were already coming back from the API, discarded by the adapter on the way
 * in. Here they are the body of the page.
 *
 * The trade segment sits next to the name for the same reason. It is not decoration: it selects
 * the price grid this customer is charged, so it is the first thing that explains the totals
 * further down.
 */
const CustomerDetail = () => {
  const { id } = useParams();
  const { currency } = useUtilsFunction();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCustomer(await CustomerServices.getCustomerById(id));
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleBlock = async () => {
    const blocking = customer.status === "Active";
    setSaving(true);
    try {
      await CustomerServices.updateCustomer(id, {
        status: blocking ? "Inactive" : "Active",
      });
      notifySuccess(blocking ? "Client bloqué." : "Client débloqué.");
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !customer) return <Loader label="Chargement du client…" />;
  if (!customer) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500">Ce client est introuvable.</p>
        <Link
          to="/customers"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          <FiArrowLeft /> Retour aux clients
        </Link>
      </div>
    );
  }

  const orders = customer.recentOrders || [];
  const money = (v) => `${currency}${Number(v || 0).toFixed(2)}`;
  const average = customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0;
  const blocked = customer.status !== "Active";

  return (
    <>
      <Link
        to="/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-emerald-600"
      >
        <FiArrowLeft className="h-4 w-4" /> Tous les clients
      </Link>

      {/* Identity */}
      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 font-serif text-xl font-bold text-emerald-600 dark:bg-emerald-500/10">
              {(customer.name || "?").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                {customer.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {customer.clientType ? (
                  <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    {customer.clientType}
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10">
                    Type d&apos;activité non défini
                  </span>
                )}
                <Badge type={blocked ? "danger" : "success"}>
                  {blocked ? "Bloqué" : "Actif"}
                </Badge>
                <span className="text-xs text-gray-400">
                  Client depuis le{" "}
                  {customer.createdAt
                    ? dayjs(customer.createdAt).format("DD MMMM YYYY")
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-emerald-600 dark:text-gray-300"
              >
                <FiMail className="h-4 w-4 text-gray-400" />
                {customer.email}
              </a>
            )}
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-emerald-600 dark:text-gray-300"
              >
                <FiPhone className="h-4 w-4 text-gray-400" />
                {customer.phone}
              </a>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={toggleBlock}
              className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition disabled:opacity-60 ${
                blocked
                  ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30"
                  : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600 dark:border-gray-600"
              }`}
            >
              {blocked ? (
                <>
                  <FiCheckCircle className="h-4 w-4" /> Débloquer
                </>
              ) : (
                <>
                  <FiSlash className="h-4 w-4" /> Bloquer
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lifetime figures. The average is derived here rather than asked for: it is the number
          that separates a shop ordering weekly from one that came once. */}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Commandes"
          value={customer.orderCount}
          hint={orders.length < customer.orderCount ? `${orders.length} récentes ci-dessous` : null}
          icon={FiShoppingBag}
        />
        <Stat label="Total dépensé" value={money(customer.totalSpent)} icon={FiTrendingUp} />
        <Stat label="Panier moyen" value={money(average)} icon={FiTrendingUp} />
      </div>

      {/* History */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <FiShoppingBag className="h-3.5 w-3.5" />
          Historique des commandes
        </h2>

        {orders.length === 0 ? (
          <EmptyState
            icon={FiShoppingBag}
            title="Aucune commande"
            description="Ce client n'a encore rien commandé."
          />
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-2 pb-3 text-left font-semibold">Commande</th>
                  <th className="px-2 pb-3 text-left font-semibold">Date</th>
                  <th className="px-2 pb-3 text-left font-semibold">Statut</th>
                  <th className="px-2 pb-3 text-right font-semibold">Total</th>
                  <th className="px-2 pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.map((order) => (
                  <tr key={order._id} className="group">
                    <td className="px-2 py-3">
                      <Link
                        to={`/order/${order._id}`}
                        className="font-semibold text-gray-700 transition group-hover:text-emerald-600 dark:text-gray-200"
                      >
                        #{order.invoice}
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-gray-500">
                      {order.createdAt
                        ? dayjs(order.createdAt).format("DD MMM YYYY, HH:mm")
                        : "-"}
                    </td>
                    <td className="px-2 py-3">
                      <Badge type={statusBadge(order.status)}>
                        {statusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-right font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                      {money(order.total)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Link
                        to={`/order/${order._id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
                      >
                        Ouvrir <FiChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-500 dark:bg-gray-700/40 dark:text-gray-400">
        <FiInfo className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Un compte client se bloque mais ne se supprime pas : l&apos;effacement d&apos;un compte
        relève du droit à l&apos;effacement (loi 09-08), traité séparément.
      </p>
    </>
  );
};

export default CustomerDetail;
