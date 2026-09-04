import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiMapPin,
  FiMessageSquare,
  FiShoppingBag,
  FiSlash,
  FiTag,
} from "react-icons/fi";

//internal import
import Modal from "@/components/common/Modal";
import Loader from "@/components/common/Loader";
import OrderServices from "@/services/OrderServices";
import OrderStatusTracker from "@/components/order/OrderStatusTracker";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@/utils/toast";
import {
  ADVANCE_VERB,
  historyLabel,
  isCancelled,
  nextStage,
  otherStages,
  statusLabel,
  statusTone,
} from "@/utils/orderStatus";

const Section = ({ title, icon: Icon, children, className = "" }) => (
  <section
    className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6 ${className}`}
  >
    <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {title}
    </h2>
    {children}
  </section>
);

const Money = ({ label, value, strong = false }) => (
  <div
    className={`flex items-center justify-between ${
      strong
        ? "border-t border-gray-100 pt-3 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-gray-50"
        : "text-sm text-gray-500 dark:text-gray-400"
    }`}
  >
    <span>{label}</span>
    <span className={strong ? "" : "font-medium text-gray-700 dark:text-gray-200"}>
      {value}
    </span>
  </div>
);

/**
 * One order, on its own page.
 *
 * It used to be a modal over the list. An order is the densest object in the back-office - lines,
 * totals, an address, a payment method, a history - and a dialog is the wrong container for it:
 * it cannot be linked to, cannot be printed, cannot be kept open next to something else, and it
 * pushed its own actions below a scroll. Anyone who needed the detail twice had to find the row
 * again. A route fixes all of that at once.
 *
 * Status management is the other half. The old form offered four labels and an Update button,
 * which asks the operator to know the lifecycle. Here the next step is a single named action -
 * "Envoyer en livraison" - with the jumps kept as secondary choices and cancellation separated
 * out behind a confirmation, because it is the one move that cannot be undone.
 */
const OrderDetail = () => {
  const { id } = useParams();
  const { currency } = useUtilsFunction();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrder(await OrderServices.getOrderById(id));
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const move = async (status, reason) => {
    setSaving(true);
    try {
      await OrderServices.updateOrder(id, { status, note: reason ?? note });
      notifySuccess(
        status === "Cancel" ? "Commande annulée." : `Commande passée en « ${statusLabel(status)} ».`
      );
      setNote("");
      setCancelReason("");
      setCancelOpen(false);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !order) return <Loader label="Chargement de la commande…" />;
  if (!order) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500">Cette commande est introuvable.</p>
        <Link
          to="/orders"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          <FiArrowLeft /> Retour aux commandes
        </Link>
      </div>
    );
  }

  const next = nextStage(order.status);
  const jumps = otherStages(order.status);
  const closed = isCancelled(order.status) || order.status === "Delivered";
  const money = (v) => `${currency}${Number(v || 0).toFixed(2)}`;

  return (
    <>
      <Link
        to="/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-emerald-600"
      >
        <FiArrowLeft className="h-4 w-4" /> Toutes les commandes
      </Link>

      {/* Header: identity, state, and the two things you print. */}
      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-gray-700 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
              <FiShoppingBag className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                #{order.invoice}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {order.createdAt
                  ? dayjs(order.createdAt).format("DD MMMM YYYY à HH:mm")
                  : "-"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusTone(
                    order.status
                  )}`}
                >
                  {statusLabel(order.status)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  <FiCreditCard className="h-3 w-3" />
                  {order.paymentMethod === "Cash"
                    ? "Paiement à la livraison"
                    : order.paymentMethod}
                </span>
                {order.couponCode && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <FiTag className="h-3 w-3" />
                    {order.couponCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/order/${id}/invoice`}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:border-emerald-300 hover:text-emerald-600 dark:border-gray-600 dark:text-gray-300"
            >
              <FiFileText className="h-4 w-4" /> Facture
            </Link>
            <span className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-50">
              {money(order.total)}
            </span>
          </div>
        </div>

        <div className="pt-6">
          <OrderStatusTracker status={order.status} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Lines. A table rather than a list: quantity and unit price are what an operator
              checks against the picking sheet, and they have to line up to be scanned. */}
          <Section title="Articles" icon={FiShoppingBag}>
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-gray-400">
                    <th className="px-2 pb-3 text-left font-semibold">Produit</th>
                    <th className="px-2 pb-3 text-center font-semibold">Qté</th>
                    <th className="px-2 pb-3 text-right font-semibold">Prix unitaire</th>
                    <th className="px-2 pb-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(order.cart || []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-2 py-3">
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          {item.title}
                        </p>
                        {item.unit && (
                          <p className="text-xs text-gray-400">{item.unit}</p>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center tabular-nums text-gray-600 dark:text-gray-300">
                        {item.quantity}
                      </td>
                      <td className="px-2 py-3 text-right tabular-nums text-gray-500">
                        {money(item.price)}
                      </td>
                      <td className="px-2 py-3 text-right font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                        {money(item.itemTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* The history the API has always kept and nobody could see. */}
          <Section title="Historique" icon={FiClock}>
            {order.timeline?.length ? (
              <ol className="relative space-y-5 ps-6">
                <span className="absolute bottom-2 left-[7px] top-2 w-px bg-gray-200 dark:bg-gray-700" />
                {order.timeline.map((entry, i) => (
                  <li key={`${entry.rawStatus}-${entry.createdAt}-${i}`} className="relative">
                    <span
                      className={`absolute -start-6 top-1 h-3.5 w-3.5 rounded-full ring-4 ring-white dark:ring-gray-800 ${
                        i === order.timeline.length - 1
                          ? "bg-emerald-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {historyLabel(entry.rawStatus)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {entry.createdAt
                        ? dayjs(entry.createdAt).format("DD MMM YYYY, HH:mm")
                        : "-"}
                    </p>
                    {entry.note && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {entry.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-400">
                Aucun changement de statut enregistré pour l'instant.
              </p>
            )}
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Récapitulatif" icon={FiCreditCard}>
            <div className="space-y-2.5">
              <Money label="Sous-total" value={money(order.subTotal)} />
              <Money label="Livraison" value={money(order.shippingCost)} />
              <Money label="Remise" value={`- ${money(order.discount)}`} />
              <Money label="Total" value={money(order.total)} strong />
            </div>
          </Section>

          <Section title="Livraison" icon={FiMapPin}>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {order.user_info?.name || "Client"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              {[order.user_info?.address, order.user_info?.city]
                .filter(Boolean)
                .join(", ") || "Adresse non renseignée"}
            </p>
          </Section>

          {order.note && (
            <Section title="Note du client" icon={FiMessageSquare}>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {order.note}
              </p>
            </Section>
          )}
        </div>
      </div>

      {/* Actions last, and never a wall of equal buttons: one obvious step forward, the jumps
          behind it, and the irreversible one set apart. */}
      <Section title="Faire avancer la commande" icon={FiArrowRight} className="mt-5">
        {closed ? (
          <p className="text-sm text-gray-400">
            {isCancelled(order.status)
              ? "Cette commande est annulée : son statut ne peut plus changer."
              : "Cette commande est livrée. Le parcours est terminé."}
          </p>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Note (facultatif)
              </span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={255}
                placeholder="Ex. : livreur prévenu, passage prévu demain matin"
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 placeholder-gray-400 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              />
              <span className="mt-1 block text-xs text-gray-400">
                Elle reste attachée à ce changement dans l'historique.
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              {next && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => move(next.key)}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60"
                >
                  {saving ? "Enregistrement…" : ADVANCE_VERB[next.key] || next.label}
                  <FiArrowRight className="h-4 w-4" />
                </button>
              )}

              {jumps.map((stage) => (
                <button
                  key={stage.key}
                  type="button"
                  disabled={saving}
                  onClick={() => move(stage.key)}
                  className="inline-flex h-11 items-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300"
                >
                  {ADVANCE_VERB[stage.key] || stage.label}
                </button>
              ))}

              <button
                type="button"
                disabled={saving}
                onClick={() => setCancelOpen(true)}
                className="ms-auto inline-flex h-11 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-500 transition hover:border-red-300 hover:text-red-600 disabled:opacity-60 dark:border-gray-600"
              >
                <FiSlash className="h-4 w-4" /> Annuler la commande
              </button>
            </div>
          </div>
        )}
      </Section>

      <Modal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Annuler cette commande ?"
        subtitle={`#${order.invoice} · ${money(order.total)}`}
        icon={FiAlertTriangle}
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCancelOpen(false)}
              className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
            >
              Revenir
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => move("Cancel", cancelReason)}
              className="h-10 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
            >
              {saving ? "Annulation…" : "Confirmer l'annulation"}
            </button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          L'annulation est définitive : le statut ne pourra plus changer ensuite. Le stock
          réservé est rendu et le client en est informé.
        </p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
            Motif (facultatif)
          </span>
          <input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            maxLength={255}
            placeholder="Ex. : rupture de stock, demande du client"
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 placeholder-gray-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
          />
          <span className="mt-1 block text-xs text-gray-400">
            Il apparaît dans l'historique de la commande.
          </span>
        </label>
      </Modal>
    </>
  );
};

export default OrderDetail;
