import dayjs from "dayjs";
import Image from "next/image";
import React from "react";
//internal import
import OrderTable from "@components/order/OrderTable";
import useUtilsFunction from "@hooks/useUtilsFunction";
import OrderStatusPill from "@components/order/OrderStatusPill";
import { useTranslation } from "react-i18next";

/**
 * The customer's invoice, laid out exactly like the one the back-office prints.
 *
 * It used to be its own design - a sand header, an emerald totals band, its own spacing - so
 * the same order looked like two different documents depending on who opened it. A merchant
 * comparing the copy a customer received with the copy in the back-office should be reading
 * the same page: same header, same three meta columns, same table, same totals box.
 */
const Invoice = ({ data, printRef, globalSetting, currency }) => {
  const { t } = useTranslation();

  const { getNumberTwo } = useUtilsFunction();

  const thCls =
    "font-serif font-semibold px-6 py-2 text-gray-700 uppercase tracking-wider";
  const labelCls =
    "font-bold font-serif text-sm uppercase text-gray-600 block";
  const totalLabelCls =
    "mb-1 font-bold font-serif text-sm uppercase text-gray-600 block";

  return (
    <div ref={printRef} className="p-6 lg:p-8">
      {/* Header: what the document is, and who issued it. */}
      <div className="flex flex-col justify-between border-b border-gray-100 pb-4 md:flex-row lg:flex-row lg:items-center">
        <div>
          <h1 className="font-serif text-xl font-bold uppercase">
            {t("invoice.title")}
          </h1>
          {/* One status vocabulary for the whole store - the old six-way string compare
              rendered nothing at all for CONFIRMED, PREPARING and OUT_FOR_DELIVERY. */}
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <span>{t("invoice.status")}</span>
            <OrderStatusPill status={data?.status} size="sm" />
          </div>
        </div>
        <div className="text-start lg:text-end">
          {/* The stacked lockup: an invoice is the one page that leaves the site, so it
              carries the full mark rather than the navbar's horizontal one. */}
          <Image
            src="/brand/logo-primary.png"
            alt="Market Food"
            width={92}
            height={64}
            className="mt-4 h-16 w-auto lg:mt-0 lg:ms-auto"
          />
          <p className="mt-2 text-sm text-gray-500">
            {globalSetting?.address} <br />
            {globalSetting?.contact} <br />
            <span>{globalSetting?.email}</span> <br />
            {globalSetting?.website}
          </p>
        </div>
      </div>

      {/* When, which number, and for whom. */}
      <div className="flex flex-col justify-between pt-4 md:flex-row lg:flex-row">
        <div className="mb-3 flex flex-col md:mb-0 lg:mb-0">
          <span className={labelCls}>{t("invoice.date")}</span>
          <span className="block text-sm text-gray-500">
            {data.createdAt !== undefined && (
              <span>{dayjs(data?.createdAt).format("DD/MM/YYYY")}</span>
            )}
          </span>
        </div>
        <div className="mb-3 flex flex-col md:mb-0 lg:mb-0">
          <span className={labelCls}>{t("invoice.number")}</span>
          <span className="block text-sm text-gray-500">#{data?.invoice}</span>
        </div>
        <div className="flex flex-col text-start lg:text-end">
          <span className={labelCls}>{t("invoice.bill_to")}</span>
          <span className="block text-sm text-gray-500">
            {data?.user_info?.name} <br />
            {data?.user_info?.email}{" "}
            <span className="ms-2">{data?.user_info?.contact}</span>
            <br />
            {data?.user_info?.address}
            <br />
            {/* Country and postcode are no longer collected - printing them left a line of
                trailing spaces on every invoice. */}
            {data?.city}
          </span>
        </div>
      </div>

      <div className="my-8 overflow-x-auto">
        <table className="min-w-full table-auto divide-y divide-gray-200 border border-gray-100">
          <thead className="bg-gray-50">
            <tr className="bg-gray-100 text-xs">
              <th scope="col" className={`${thCls} text-start`}>
                N°
              </th>
              <th scope="col" className={`${thCls} text-start`}>
                {t("invoice.product")}
              </th>
              <th scope="col" className={`${thCls} text-center`}>
                {t("invoice.quantity")}
              </th>
              <th scope="col" className={`${thCls} text-center`}>
                {t("invoice.price")}
              </th>
              <th scope="col" className={`${thCls} text-end`}>
                {t("invoice.amount")}
              </th>
            </tr>
          </thead>
          <OrderTable data={data} currency={currency} />
        </table>
      </div>

      {/* Totals, in the same bordered box the back-office prints. */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 py-6">
        <div className="flex flex-col justify-between md:flex-row lg:flex-row">
          <div className="mb-3 flex flex-col sm:flex-wrap md:mb-0 lg:mb-0">
            <span className={totalLabelCls}>{t("invoice.payment_method")}</span>
            <span className="block font-serif text-sm font-semibold text-gray-500">
              {data?.paymentMethod === "Cash"
                ? t("invoice.cod")
                : data?.paymentMethod}
            </span>
          </div>
          <div className="mb-3 flex flex-col sm:flex-wrap md:mb-0 lg:mb-0">
            <span className={totalLabelCls}>{t("invoice.shipping")}</span>
            <span className="block font-serif text-sm font-semibold">
              {Number(data.shippingCost) > 0 ? (
                <span className="text-gray-500">
                  {currency}
                  {getNumberTwo(data.shippingCost)}
                </span>
              ) : (
                <span className="text-emerald-600">{t("invoice.free")}</span>
              )}
            </span>
          </div>
          <div className="mb-3 flex flex-col sm:flex-wrap md:mb-0 lg:mb-0">
            <span className={totalLabelCls}>{t("invoice.discount")}</span>
            <span className="block font-serif text-sm font-semibold text-gray-500">
              {currency}
              {getNumberTwo(data.discount)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-wrap">
            <span className={totalLabelCls}>{t("invoice.total")}</span>
            <span className="block font-serif text-xl font-bold text-red-500">
              {currency}
              {getNumberTwo(data.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
