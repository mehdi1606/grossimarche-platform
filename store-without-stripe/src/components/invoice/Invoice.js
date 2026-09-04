import dayjs from "dayjs";
import React from "react";
//internal import
import OrderTable from "@components/order/OrderTable";
import useUtilsFunction from "@hooks/useUtilsFunction";
import BrandMark from "@components/common/BrandMark";
import OrderStatusPill from "@components/order/OrderStatusPill";
import { useTranslation } from "react-i18next";

const Invoice = ({ data, printRef, globalSetting, currency }) => {
  const { t } = useTranslation();
  // console.log('invoice data',data)

  const { getNumberTwo } = useUtilsFunction();

  return (
    <div ref={printRef}>
      <div className="bg-sand p-8 rounded-t-xl">
        <div className="flex lg:flex-row md:flex-row flex-col lg:items-center justify-between pb-4 border-b border-gray-50">
          <div>
            <h1 className="font-display text-2xl font-semibold uppercase">{t("invoice.title")}</h1>
            {/* One status vocabulary for the whole store - the old six-way string compare
                rendered nothing at all for CONFIRMED, PREPARING and OUT_FOR_DELIVERY. */}
            <div className="mt-2 flex items-center gap-2 text-ink-600">
              <span className="text-sm">{t("invoice.status")}</span>
              <OrderStatusPill status={data?.status} size="sm" />
            </div>
          </div>
          <div className="lg:text-end text-start">
            <BrandMark variant="dark" className="lg:justify-end" />
            <p className="mt-1 text-sm text-gray-500">
              {globalSetting?.address ||
                "Marché de gros en ligne - Maroc"}
            </p>
          </div>
        </div>
        <div className="flex lg:flex-row md:flex-row flex-col justify-between pt-4">
          <div className="mb-3 md:mb-0 lg:mb-0 flex flex-col">
            <span className="font-bold font-serif text-sm uppercase text-gray-600 block">
              {t("invoice.date")}
            </span>
            <span className="text-sm text-gray-500 block">
              {data.createdAt !== undefined && (
                <span>{dayjs(data?.createdAt).format("MMMM D, YYYY")}</span>
              )}
            </span>
          </div>
          <div className="mb-3 md:mb-0 lg:mb-0 flex flex-col">
            <span className="font-bold font-serif text-sm uppercase text-gray-600 block">
              {t("invoice.number")}
            </span>
            <span className="text-sm text-gray-500 block">
              #{data?.invoice}
            </span>
          </div>
          <div className="flex flex-col lg:text-end text-start">
            <span className="font-bold font-serif text-sm uppercase text-gray-600 block">
              {t("invoice.bill_to")}
            </span>
            <span className="text-sm text-gray-500 block">
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
      </div>
      <div className="s">
        <div className="overflow-hidden lg:overflow-visible px-8 my-10">
          <div className="-my-2 overflow-x-auto">
            <table className="table-auto min-w-full border border-gray-100 divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-xs bg-gray-100">
                  <th
                    scope="col"
                    className="font-serif font-semibold px-6 py-2 text-gray-700 uppercase tracking-wider text-start"
                  >
                    Sr.
                  </th>
                  <th
                    scope="col"
                    className="font-serif font-semibold px-6 py-2 text-gray-700 uppercase tracking-wider text-start"
                  >
                    {t("invoice.product")}
                  </th>
                  <th
                    scope="col"
                    className="font-serif font-semibold px-6 py-2 text-gray-700 uppercase tracking-wider text-center"
                  >
                    {t("invoice.quantity")}
                  </th>
                  <th
                    scope="col"
                    className="font-serif font-semibold px-6 py-2 text-gray-700 uppercase tracking-wider text-center"
                  >
                    {t("invoice.price")}
                  </th>

                  <th
                    scope="col"
                    className="font-serif font-semibold px-6 py-2 text-gray-700 uppercase tracking-wider text-end"
                  >
                    {t("invoice.amount")}
                  </th>
                </tr>
              </thead>
              <OrderTable data={data} currency={currency} />
            </table>
          </div>
        </div>
      </div>

      <div className="border-t border-b border-gray-100 p-10 bg-emerald-50">
        <div className="flex lg:flex-row md:flex-row flex-col justify-between pt-4">
          <div className="mb-3 md:mb-0 lg:mb-0  flex flex-col sm:flex-wrap">
            <span className="mb-1 font-bold font-serif text-sm uppercase text-gray-600 block">
              {t("invoice.payment_method")}
            </span>
            <span className="text-sm text-gray-500 font-semibold font-serif block">
              {data?.paymentMethod === "Cash"
                ? t("invoice.cod")
                : data?.paymentMethod}
            </span>
          </div>
          <div className="mb-3 md:mb-0 lg:mb-0  flex flex-col sm:flex-wrap">
            <span className="mb-1 font-bold font-serif text-sm uppercase text-gray-600 block">
              {t("invoice.shipping")}
            </span>
            <span className="text-sm font-semibold font-serif block">
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
          <div className="mb-3 md:mb-0 lg:mb-0  flex flex-col sm:flex-wrap">
            <span className="mb-1 font-bold font-serif text-sm uppercase text-gray-600 block">
              {t("invoice.discount")}
            </span>
            <span className="text-sm text-gray-500 font-semibold font-serif block">
              {currency}
              {getNumberTwo(data.discount)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-wrap">
            <span className="mb-1 font-bold font-serif text-sm uppercase text-gray-600 block">
              {t("invoice.total")}
            </span>
            <span className="text-2xl font-serif font-bold text-red-500 block">
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
