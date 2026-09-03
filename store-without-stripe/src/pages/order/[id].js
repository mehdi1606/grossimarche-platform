import { PDFDownloadLink } from "@react-pdf/renderer";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  IoCloudDownloadOutline,
  IoPrintOutline,
  IoChevronBack,
} from "react-icons/io5";
import { FiSlash, FiRefreshCw, FiTruck } from "react-icons/fi";
import ReactToPrint from "react-to-print";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

//internal import

import Layout from "@layout/Layout";
import useGetSetting from "@hooks/useGetSetting";
import useReorder from "@hooks/useReorder";
import Invoice from "@components/invoice/Invoice";
import Loading from "@components/preloader/Loading";
import OrderServices from "@services/OrderServices";
import useUtilsFunction from "@hooks/useUtilsFunction";
import OrderTimeline from "@components/order/OrderTimeline";
import OrderStatusPill from "@components/order/OrderStatusPill";
import InvoiceForDownload from "@components/invoice/InvoiceForDownload";
import { notifyError, notifySuccess } from "@utils/toast";
import { canCustomerCancel, statusMeta } from "@utils/orderStatus";
import { estimatedDeliveryLabel } from "@utils/delivery";

dayjs.locale("fr");

const Order = ({ params }) => {
  const printRef = useRef();
  const orderId = params.id;
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data, error, isLoading } = useQuery({
    // Keyed by id - the old key was the constant "order", so opening a second order showed
    // the first one's cached data.
    queryKey: ["order", orderId],
    queryFn: async () => await OrderServices.getOrderById(orderId),
  });

  const { getNumberTwo, currency } = useUtilsFunction();
  const { globalSetting } = useGetSetting();
  const { reorder, reorderingId } = useReorder();

  const cancelMutation = useMutation({
    mutationFn: async () => OrderServices.cancelOrder(orderId),
    onSuccess: () => {
      notifySuccess("Votre commande a été annulée.");
      setConfirmCancel(false);
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) =>
      notifyError(
        err?.response?.data?.message || "Impossible d'annuler cette commande."
      ),
  });

  return (
    <Layout title="Suivi de commande" description="Suivez votre commande Grossimarché">
      {isLoading ? (
        <Loading loading={isLoading} />
      ) : error ? (
        <h2 className="mx-auto my-10 w-11/12 text-center text-xl text-red-400">
          {error?.message || "Commande introuvable."}
        </h2>
      ) : (
        <div className="mx-auto max-w-screen-2xl px-3 py-10 sm:px-6">
          <Link
            href="/user/my-orders"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-emerald-700"
          >
            <IoChevronBack className="gm-dir-icon" /> Mes commandes
          </Link>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Tracking is the reason this page gets opened - it leads. The invoice, which
                used to be the entire page, now sits underneath it. */}
            <section className="lg:col-span-2">
              <div className="rounded-2xl border border-line bg-white p-6 shadow-luxe sm:p-8">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
                  <div>
                    <p className="text-2xs font-medium uppercase tracking-luxe text-ink-400">
                      Commande
                    </p>
                    <h1 data-no-translate className="gm-ltr mt-1 font-display text-2xl font-semibold text-ink-900">
                      {data?.invoice || `#${orderId?.slice(0, 8)}`}
                    </h1>
                    <p className="mt-1 text-sm text-ink-500">
                      Passée le {dayjs(data?.createdAt).format("D MMMM YYYY à HH:mm")}
                    </p>
                  </div>
                  <div className="text-end">
                    <OrderStatusPill status={data?.status} />
                    <p data-no-translate className="mt-2 font-display text-xl font-semibold tabular-nums text-ink-900">
                      {currency}
                      {getNumberTwo(data?.total)}
                    </p>
                  </div>
                </div>

                <p className="mb-6 text-sm text-ink-600">
                  {statusMeta(data?.status).description}
                </p>

                {/* A concrete arrival day, while the order is still on its way. */}
                {!["DELIVERED", "CANCELLED"].includes(data?.status) && (
                  <div className="mb-8 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
                    <FiTruck className="h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm text-emerald-800">
                      Livraison estimée le{" "}
                      <span className="font-semibold">{estimatedDeliveryLabel()}</span>
                      {data?.city ? ` à ${data.city}` : ""}
                    </p>
                  </div>
                )}

                <OrderTimeline status={data?.status} timeline={data?.timeline} />

                {data?.note && (
                  <div className="mt-6 rounded-xl border border-line bg-sand p-4">
                    <p className="text-2xs font-medium uppercase tracking-luxe text-ink-400">
                      Vos instructions
                    </p>
                    <p className="mt-1 text-sm text-ink-700">{data.note}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Actions */}
            <aside className="lg:col-span-1">
              <div className="sticky top-28 space-y-3 rounded-2xl border border-line bg-white p-6 shadow-luxe">
                <h2 className="font-display text-base font-semibold text-ink-800">
                  Actions
                </h2>

                <button
                  onClick={() => reorder(orderId)}
                  disabled={reorderingId === orderId}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-luxe transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  <FiRefreshCw
                    className={`h-4 w-4 ${reorderingId === orderId ? "animate-spin" : ""}`}
                  />
                  Commander à nouveau
                </button>

                <PDFDownloadLink
                  document={
                    <InvoiceForDownload
                      data={data}
                      currency={currency}
                      globalSetting={globalSetting}
                      getNumberTwo={getNumberTwo}
                    />
                  }
                  fileName={`Facture-${data?.invoice || "commande"}.pdf`}
                  className="block"
                >
                  {({ loading }) => (
                    <span className="flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3 text-sm font-medium text-ink-700 transition hover:border-emerald-300 hover:text-emerald-700">
                      <IoCloudDownloadOutline className="text-base" />
                      {loading ? "Génération…" : "Télécharger la facture"}
                    </span>
                  )}
                </PDFDownloadLink>

                <ReactToPrint
                  trigger={() => (
                    <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3 text-sm font-medium text-ink-700 transition hover:border-emerald-300 hover:text-emerald-700">
                      <IoPrintOutline className="text-base" />
                      Imprimer
                    </button>
                  )}
                  content={() => printRef.current}
                  documentTitle={`Facture-${data?.invoice || "commande"}`}
                />

                {/* Self-service cancellation, offered only while the backend would accept it. */}
                {canCustomerCancel(data?.status) && (
                  <div className="border-t border-line pt-3">
                    {confirmCancel ? (
                      <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                        <p className="mb-3 text-xs text-red-700">
                          Annuler définitivement cette commande ?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => cancelMutation.mutate()}
                            disabled={cancelMutation.isPending}
                            className="flex-1 rounded-lg bg-red-500 py-2 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                          >
                            {cancelMutation.isPending ? "Annulation…" : "Oui, annuler"}
                          </button>
                          <button
                            onClick={() => setConfirmCancel(false)}
                            className="flex-1 rounded-lg border border-line bg-white py-2 text-xs font-medium text-ink-600"
                          >
                            Retour
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancel(true)}
                        className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-ink-400 transition hover:text-red-500"
                      >
                        <FiSlash className="h-3.5 w-3.5" />
                        Annuler la commande
                      </button>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Invoice / detail */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-luxe">
            <Invoice
              data={data}
              printRef={printRef}
              currency={currency}
              globalSetting={globalSetting}
            />
          </div>
        </div>
      )}
    </Layout>
  );
};

export const getServerSideProps = ({ params }) => {
  return {
    props: { params },
  };
};

export default dynamic(() => Promise.resolve(Order), { ssr: false });
