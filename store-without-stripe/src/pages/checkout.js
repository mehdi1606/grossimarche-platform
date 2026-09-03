import React, { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  IoReturnUpBackOutline,
  IoArrowForward,
  IoBagHandle,
  IoWalletSharp,
  IoLocationOutline,
  IoAddCircleOutline,
} from "react-icons/io5";
import { FiCheck, FiLock, FiRefreshCw, FiTruck } from "react-icons/fi";

//internal import

import Layout from "@layout/Layout";
import Label from "@components/form/Label";
import Error from "@components/form/Error";
import CartItem from "@components/cart/CartItem";
import InputArea from "@components/form/InputArea";
import useGetSetting from "@hooks/useGetSetting";
import InputPayment from "@components/form/InputPayment";
import useCheckoutSubmit from "@hooks/useCheckoutSubmit";
import useUtilsFunction from "@hooks/useUtilsFunction";
import AddressModal from "@components/modal/AddressModal";
import UpsellModal from "@components/modal/UpsellModal";
import useSuggestedProducts from "@hooks/useSuggestedProducts";
import { estimatedDeliveryLabel } from "@utils/delivery";

// The three things the checkout asks for, named once. The page used to number its sections
// "01./02./03." in plain text with no indication of where the shopper stood.
const STEPS = ["Vos coordonnées", "Livraison", "Paiement"];

const StepIndicator = ({ current }) => (
  <ol className="mb-10 flex items-center gap-2 sm:gap-4">
    {STEPS.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1 transition ${
              done
                ? "bg-emerald-600 text-white ring-emerald-600"
                : active
                  ? "bg-white text-emerald-700 ring-emerald-500"
                  : "bg-sand text-ink-400 ring-line"
            }`}
          >
            {done ? <FiCheck className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <span
            className={`hidden text-xs font-medium sm:block ${
              done || active ? "text-ink-800" : "text-ink-400"
            }`}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <span
              className={`h-px flex-1 ${done ? "bg-emerald-400" : "bg-line"}`}
              aria-hidden="true"
            />
          )}
        </li>
      );
    })}
  </ol>
);

const Checkout = () => {
  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();

  const {
    couponInfo,
    couponRef,
    total,
    isEmpty,
    items,
    cartTotal,
    currency,
    register,
    errors,
    setShowCard,
    handleSubmit,
    submitHandler,
    handleCouponCode,
    discountAmount,
    shippingCost,
    qualifiesFreeShipping,
    freeShippingRemaining,
    isCheckoutSubmit,
    isCouponAvailable,
    bundleSavings,
    selectedAddress,
    addressModalOpen,
    setAddressModalOpen,
    saveAddress,
    savingAddress,
  } = useCheckoutSubmit();

  // Last-chance cross-sell: the first time the shopper confirms, if we have relevant
  // suggestions, show the upsell modal instead of placing the order. A second confirm (or the
  // modal's own confirm button) goes straight through - never block the sale twice.
  const { suggestions } = useSuggestedProducts({ limit: 8 });
  const [upsellOpen, setUpsellOpen] = useState(false);
  const upsellShown = useRef(false);

  const onConfirm = (data) => {
    if (!upsellShown.current && !isEmpty && suggestions.length > 0) {
      upsellShown.current = true;
      setUpsellOpen(true);
      return;
    }
    submitHandler(data);
  };

  // Which step the shopper is on, derived from what they have actually supplied rather than
  // from a wizard they have to click through.
  const currentStep = selectedAddress ? 2 : 1;

  const confirmLabel =
    showingTranslateValue(storeCustomizationSetting?.checkout?.confirm_button) ||
    "Confirmer la commande";

  return (
    <>
      <Layout title="Commande" description="Finalisez votre commande Grossimarché">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
          <div className="flex w-full flex-col px-0 py-10 pb-28 lg:flex-row lg:py-12 lg:pb-12 xl:max-w-screen-xl 2xl:max-w-screen-2xl">
            <div className="order-2 flex h-full flex-col sm:order-1 md:w-full lg:order-1 lg:w-3/5">
              <div className="mt-5 md:col-span-2 md:mt-0">
                <StepIndicator current={currentStep} />

                <form onSubmit={handleSubmit(onConfirm)}>
                  <div className="form-group">
                    <h2 className="pb-3 font-display text-lg font-semibold text-ink-800">
                      01.{" "}
                      {showingTranslateValue(
                        storeCustomizationSetting?.checkout?.personal_details
                      )}
                    </h2>

                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6 sm:col-span-3">
                        <InputArea
                          register={register}
                          label={showingTranslateValue(
                            storeCustomizationSetting?.checkout?.first_name
                          )}
                          name="firstName"
                          type="text"
                          placeholder="Youssef"
                        />
                        <Error errorName={errors.firstName} />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <InputArea
                          register={register}
                          label={showingTranslateValue(
                            storeCustomizationSetting?.checkout?.last_name
                          )}
                          name="lastName"
                          type="text"
                          placeholder="Alami"
                          required={false}
                        />
                        <Error errorName={errors.lastName} />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <InputArea
                          register={register}
                          label={showingTranslateValue(
                            storeCustomizationSetting?.checkout?.email_address
                          )}
                          name="email"
                          type="email"
                          readOnly={true}
                          placeholder="vous@exemple.com"
                        />
                        <Error errorName={errors.email} />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <InputArea
                          register={register}
                          label={showingTranslateValue(
                            storeCustomizationSetting?.checkout?.checkout_phone
                          )}
                          name="contact"
                          type="tel"
                          placeholder="+212 6 00 00 00 00"
                        />

                        <Error errorName={errors.contact} />
                      </div>
                    </div>
                  </div>

                  <div className="form-group mt-12">
                    <h2 className="pb-3 font-display text-lg font-semibold text-ink-800">
                      02.{" "}
                      {showingTranslateValue(
                        storeCustomizationSetting?.checkout?.shipping_details
                      )}
                    </h2>

                    <div className="mb-8">
                      {selectedAddress ? (
                        <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-full bg-white text-emerald-600 shadow-sm">
                              <IoLocationOutline />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-ink-800">
                                Livrer à
                              </p>
                              <p className="text-sm text-ink-600">
                                {selectedAddress.addressLine}
                              </p>
                              <p className="text-sm text-ink-500">
                                {selectedAddress.city}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAddressModalOpen(true)}
                            className="shrink-0 text-sm font-medium text-emerald-700 transition hover:underline"
                          >
                            Modifier
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddressModalOpen(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-white px-4 py-6 text-sm font-medium text-ink-600 transition hover:border-emerald-300 hover:text-emerald-700"
                        >
                          <IoAddCircleOutline className="text-lg" />
                          Ajouter une adresse de livraison
                        </button>
                      )}
                    </div>

                    <Label label="Livraison" />
                    <div className="rounded-2xl border border-line bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                            <FiTruck className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ink-800">
                              Livraison standard
                            </p>
                            {/* A date, not a vague range - it is what removes the "when will
                                it arrive?" hesitation right before confirming. */}
                            <p className="text-xs text-ink-500">
                              Estimée le{" "}
                              <span className="font-medium text-ink-700">
                                {estimatedDeliveryLabel()}
                              </span>
                              {selectedAddress?.city ? ` · ${selectedAddress.city}` : ""}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            qualifiesFreeShipping ? "text-emerald-700" : "text-ink-800"
                          }`}
                        >
                          {qualifiesFreeShipping
                            ? "Offerte"
                            : `${currency}${shippingCost.toFixed(2)}`}
                        </span>
                      </div>

                      {/* Free-shipping progress nudge (AOV lever) */}
                      {!qualifiesFreeShipping && cartTotal > 0 && (
                        <div className="mt-3 border-t border-line pt-3">
                          <p className="mb-1.5 text-xs text-ink-600">
                            Plus que{" "}
                            <span className="font-semibold text-emerald-700">
                              {currency}
                              {freeShippingRemaining.toFixed(2)}
                            </span>{" "}
                            pour la{" "}
                            <span className="font-semibold">livraison offerte</span>
                          </p>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-sand">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (cartTotal / (cartTotal + freeShippingRemaining)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {qualifiesFreeShipping && (
                        <div className="mt-3 border-t border-line pt-3">
                          <p className="text-xs font-medium text-emerald-700">
                            Vous bénéficiez de la livraison offerte.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* The backend has always accepted a note on the order; nothing in the
                        UI ever collected one. Delivery instructions are exactly the kind of
                        thing a wholesale customer needs to pass on. */}
                    <div className="mt-6">
                      <Label label="Instructions de livraison (facultatif)" />
                      <textarea
                        {...register("orderNote")}
                        rows={3}
                        maxLength={500}
                        placeholder="Étage, horaires de réception, contact sur place…"
                        className="form-input w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink-800 transition placeholder:text-ink-300 focus:border-emerald-500 focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="form-group mt-12">
                    <h2 className="pb-3 font-display text-lg font-semibold text-ink-800">
                      03.{" "}
                      {showingTranslateValue(
                        storeCustomizationSetting?.checkout?.payment_method
                      )}
                    </h2>

                    {/* COD only for launch. CMI card payment exists in the backend but is
                        hidden until online payment is enabled. */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <InputPayment
                          setShowCard={setShowCard}
                          register={register}
                          name="Paiement à la livraison"
                          value="COD"
                          Icon={IoWalletSharp}
                        />
                        <Error errorMessage={errors.paymentMethod} />
                      </div>
                    </div>
                  </div>

                  {/* Reassurance sits next to the commitment, not in the footer. */}
                  <div className="mt-8 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-3">
                    {[
                      { Icon: FiLock, title: "Aucun prépaiement", text: "Vous payez à la réception" },
                      { Icon: FiTruck, title: "Livraison suivie", text: "Statut en temps réel" },
                      { Icon: FiRefreshCw, title: "Annulation libre", text: "Tant que non confirmée" },
                    ].map(({ Icon, title, text }) => (
                      <div key={title} className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-ink-800">{title}</p>
                          <p className="text-2xs text-ink-500">{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 grid grid-cols-6 gap-4 lg:gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <Link
                        href="/"
                        className="flex w-full justify-center rounded-xl border border-line bg-white py-3 text-center text-sm font-medium text-ink-700 transition-all hover:border-emerald-300 hover:text-emerald-700"
                      >
                        <span className="me-2 text-xl">
                          <IoReturnUpBackOutline />
                        </span>
                        {showingTranslateValue(
                          storeCustomizationSetting?.checkout?.continue_button
                        )}
                      </Link>
                    </div>
                    <div className="col-span-6 hidden sm:col-span-3 sm:block">
                      <button
                        type="submit"
                        disabled={isEmpty || isCheckoutSubmit}
                        className="flex w-full justify-center rounded-xl bg-emerald-600 py-3 text-center text-sm font-semibold text-white shadow-luxe transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCheckoutSubmit ? (
                          <span className="flex justify-center text-center">
                            <img
                              src="/loader/spinner.gif"
                              alt="Chargement"
                              width={20}
                              height={10}
                            />
                            <span className="ms-2">Traitement…</span>
                          </span>
                        ) : (
                          <span className="flex justify-center text-center">
                            {confirmLabel}
                            <span className="ms-2 text-xl">
                              <IoArrowForward className="gm-dir-icon" />
                            </span>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Mobile: the commitment stays in the thumb zone instead of being scrolled
                      past at the bottom of a long form. */}
                  <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-white/95 p-3 backdrop-blur sm:hidden">
                    <button
                      type="submit"
                      disabled={isEmpty || isCheckoutSubmit}
                      className="flex w-full items-center justify-between rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-luxe transition-all disabled:opacity-50"
                    >
                      <span data-no-translate className="tabular-nums">
                        {currency}
                        {parseFloat(total).toFixed(2)}
                      </span>
                      <span className="flex items-center gap-2">
                        {isCheckoutSubmit ? "Traitement…" : confirmLabel}
                        <IoArrowForward className="gm-dir-icon" />
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="top-28 flex h-full flex-col md:order-2 md:ms-6 md:w-full md:sticky lg:order-2 lg:ms-10 lg:w-2/5 lg:sticky xl:ms-14">
              <div className="order-1 rounded-2xl border border-line bg-white p-5 shadow-luxe sm:order-2 lg:px-8 lg:py-8">
                <h2 className="pb-4 font-display text-lg font-semibold text-ink-800">
                  {showingTranslateValue(
                    storeCustomizationSetting?.checkout?.order_summary
                  )}
                </h2>

                <div className="block max-h-64 w-full flex-grow overflow-y-scroll rounded-xl border border-line scrollbar-hide">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} currency={currency} compact />
                  ))}

                  {isEmpty && (
                    <div className="py-10 text-center">
                      <span className="my-auto flex justify-center text-4xl font-semibold text-ink-300">
                        <IoBagHandle />
                      </span>
                      <h2 className="pt-2 text-sm font-medium text-ink-500">
                        Votre panier est vide
                      </h2>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex w-full items-center py-4 text-sm font-semibold last:border-b-0 last:pb-0 last:text-base lg:py-4">
                  <form className="w-full">
                    {couponInfo.couponCode ? (
                      <span className="flex w-full justify-between rounded-xl bg-emerald-50 px-4 py-3 leading-tight">
                        <p className="text-emerald-700">Code appliqué</p>
                        <span className="text-end font-semibold text-emerald-800">
                          {couponInfo.couponCode}
                        </span>
                      </span>
                    ) : (
                      <div className="flex flex-col items-start justify-end sm:flex-row">
                        <input
                          ref={couponRef}
                          type="text"
                          placeholder="Code promo"
                          className="form-input h-12 w-full appearance-none rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink-800 transition duration-200 ease-in-out placeholder:text-ink-300 focus:border-emerald-500 focus:outline-none focus:ring-0 md:px-4"
                        />
                        <button
                          disabled={isCouponAvailable}
                          onClick={handleCouponCode}
                          className="mt-3 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-line px-5 py-3 text-center text-sm font-semibold leading-4 text-ink-700 transition duration-300 ease-in-out hover:bg-emerald-600 hover:text-white focus:outline-none focus-visible:outline-none sm:ms-3 sm:mt-0 sm:w-auto md:ms-3 md:mt-0 md:px-6 md:py-3.5 md:text-sm lg:ms-3 lg:mt-0 lg:px-8 lg:py-3 lg:text-base"
                        >
                          {isCouponAvailable ? (
                            <img
                              src="/loader/spinner.gif"
                              alt="Chargement"
                              width={20}
                              height={10}
                            />
                          ) : (
                            showingTranslateValue(
                              storeCustomizationSetting?.checkout?.apply_button
                            )
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                </div>

                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="font-medium text-ink-500">
                      {showingTranslateValue(
                        storeCustomizationSetting?.checkout?.sub_total
                      )}
                    </dt>
                    <dd className="font-bold tabular-nums text-ink-800">
                      {currency}
                      {cartTotal?.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-medium text-ink-500">
                      {showingTranslateValue(
                        storeCustomizationSetting?.checkout?.shipping_cost
                      )}
                    </dt>
                    <dd className="font-bold tabular-nums">
                      {qualifiesFreeShipping ? (
                        <span className="text-emerald-700">Offerte</span>
                      ) : (
                        <span className="text-ink-800">
                          {currency}
                          {shippingCost?.toFixed(2)}
                        </span>
                      )}
                    </dd>
                  </div>
                  {bundleSavings?.total > 0 && (
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-ink-500">
                        {bundleSavings.applied.length > 1
                          ? `Offres paniers (${bundleSavings.applied.length})`
                          : `Offre « ${bundleSavings.applied[0].name} »`}
                      </dt>
                      <dd
                        data-no-translate
                        className="font-bold tabular-nums text-brass-600"
                      >
                        −{currency}
                        {bundleSavings.total.toFixed(2)}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="font-medium text-ink-500">
                      {showingTranslateValue(
                        storeCustomizationSetting?.checkout?.discount
                      )}
                    </dt>
                    <dd className="font-bold tabular-nums text-brass-600">
                      −{currency}
                      {discountAmount.toFixed(2)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 border-t border-line">
                  <div className="flex items-center justify-between pt-5 text-sm font-bold uppercase tracking-wide">
                    <span className="text-ink-600">
                      {showingTranslateValue(
                        storeCustomizationSetting?.checkout?.total_cost
                      )}
                    </span>
                    <span data-no-translate className="font-display text-2xl font-semibold tabular-nums text-ink-900">
                      {currency}
                      {parseFloat(total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AddressModal
          isOpen={addressModalOpen}
          onClose={() => setAddressModalOpen(false)}
          onSave={saveAddress}
          saving={savingAddress}
          defaultValues={
            selectedAddress
              ? {
                  address: selectedAddress.addressLine,
                  city: selectedAddress.city,
                }
              : {}
          }
        />

        <UpsellModal
          isOpen={upsellOpen}
          onClose={() => setUpsellOpen(false)}
          onConfirm={() => {
            setUpsellOpen(false);
            handleSubmit(submitHandler)();
          }}
          submitting={isCheckoutSubmit}
        />
      </Layout>
    </>
  );
};

export default dynamic(() => Promise.resolve(Checkout), { ssr: false });
