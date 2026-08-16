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
import { useQuery } from "@tanstack/react-query";
import { ImCreditCard } from "react-icons/im";
import useTranslation from "next-translate/useTranslation";

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
import SettingServices from "@services/SettingServices";
import AddressModal from "@components/modal/AddressModal";
import UpsellModal from "@components/modal/UpsellModal";
import useSuggestedProducts from "@hooks/useSuggestedProducts";

const Checkout = () => {
  const { t } = useTranslation();
  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();

  const { data: storeSetting } = useQuery({
    queryKey: ["storeSetting"],
    queryFn: async () => await SettingServices.getStoreSetting(),
    staleTime: 4 * 60 * 1000, // Api request after 4 minutes
  });

  const {
    error,
    couponInfo,
    couponRef,
    total,
    isEmpty,
    items,
    cartTotal,
    currency,
    register,
    errors,
    showCard,
    setShowCard,
    handleSubmit,
    submitHandler,
    handleCouponCode,
    discountAmount,
    shippingCost,
    qualifiesFreeShipping,
    freeShippingRemaining,
    isCheckoutSubmit,
    hasShippingAddress,
    isCouponAvailable,
    selectedAddress,
    addressModalOpen,
    setAddressModalOpen,
    saveAddress,
    savingAddress,
  } = useCheckoutSubmit();

  // Last-chance cross-sell: the first time the shopper confirms, if we have relevant
  // suggestions, show the upsell modal instead of placing the order. A second confirm (or the
  // modal's own confirm button) goes straight through — never block the sale twice.
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

  return (
    <>
      <Layout title="Checkout" description="this is checkout page">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
          <div className="py-10 lg:py-12 px-0 2xl:max-w-screen-2xl w-full xl:max-w-screen-xl flex flex-col md:flex-row lg:flex-row">
            <div className="md:w-full lg:w-3/5 flex h-full flex-col order-2 sm:order-1 lg:order-1">
              <div className="mt-5 md:mt-0 md:col-span-2">
                <form onSubmit={handleSubmit(onConfirm)}>
                  <div className="form-group">
                    <h2 className="font-semibold font-serif text-base text-gray-700 pb-3">
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
                          placeholder="John"
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
                          placeholder="Doe"
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
                          placeholder="youremail@gmail.com"
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
                          placeholder="+062-6532956"
                        />

                        <Error errorName={errors.contact} />
                      </div>
                    </div>
                  </div>

                  <div className="form-group mt-12">
                    <h2 className="font-semibold font-serif text-base text-gray-700 pb-3">
                      02.{" "}
                      {showingTranslateValue(
                        storeCustomizationSetting?.checkout?.shipping_details
                      )}
                    </h2>

                    <div className="mb-8">
                      {selectedAddress ? (
                        <div className="flex items-start justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-full bg-white text-emerald-500 shadow-sm">
                              <IoLocationOutline />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                Livrer à
                              </p>
                              <p className="text-sm text-gray-600">
                                {selectedAddress.addressLine}
                              </p>
                              <p className="text-sm text-gray-500">
                                {selectedAddress.city}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAddressModalOpen(true)}
                            className="shrink-0 text-sm font-medium text-emerald-600 transition hover:text-emerald-700 hover:underline"
                          >
                            Modifier
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddressModalOpen(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-white px-4 py-6 text-sm font-medium text-gray-600 transition hover:border-emerald-300 hover:text-emerald-600"
                        >
                          <IoAddCircleOutline className="text-lg" />
                          Ajouter une adresse de livraison
                        </button>
                      )}
                    </div>

                    <Label label="Livraison" />
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-500">
                            <IoLocationOutline />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              Livraison standard
                            </p>
                            <p className="text-xs text-gray-500">
                              Partout au Maroc — paiement à la livraison
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            qualifiesFreeShipping ? "text-emerald-600" : "text-gray-800"
                          }`}
                        >
                          {qualifiesFreeShipping ? "Offerte" : `${currency}${shippingCost.toFixed(2)}`}
                        </span>
                      </div>

                      {/* Free-shipping progress nudge (AOV lever) */}
                      {!qualifiesFreeShipping && cartTotal > 0 && (
                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <p className="mb-1.5 text-xs text-gray-600">
                            Plus que{" "}
                            <span className="font-semibold text-emerald-600">
                              {currency}
                              {freeShippingRemaining.toFixed(2)}
                            </span>{" "}
                            pour la <span className="font-semibold">livraison offerte</span> 🎉
                          </p>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
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
                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <p className="text-xs font-medium text-emerald-600">
                            🎉 Vous bénéficiez de la livraison offerte !
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group mt-12">
                    <h2 className="font-semibold text-base text-gray-700 pb-3">
                      03.{" "}
                      {showingTranslateValue(
                        storeCustomizationSetting?.checkout?.payment_method
                      )}
                    </h2>

                    {/* COD only for launch. CMI card payment exists in the backend but is
                        hidden until online payment is enabled. */}
                    <div className="grid sm:grid-cols-3 grid-cols-1 gap-4">
                      <div className="">
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

                  <div className="grid grid-cols-6 gap-4 lg:gap-6 mt-10">
                    <div className="col-span-6 sm:col-span-3">
                      <Link
                        href="/"
                        className="bg-indigo-50 border border-indigo-100 rounded py-3 text-center text-sm font-medium text-gray-700 hover:text-gray-800 hover:border-gray-300 transition-all flex justify-center font-serif w-full"
                      >
                        <span className="text-xl mr-2">
                          <IoReturnUpBackOutline />
                        </span>
                        {showingTranslateValue(
                          storeCustomizationSetting?.checkout?.continue_button
                        )}
                      </Link>
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <button
                        type="submit"
                        disabled={isEmpty || isCheckoutSubmit}
                        className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-500 transition-all rounded py-3 text-center text-sm font-serif font-medium text-white flex justify-center w-full"
                      >
                        {isCheckoutSubmit ? (
                          <span className="flex justify-center text-center">
                            {" "}
                            <img
                              src="/loader/spinner.gif"
                              alt="Loading"
                              width={20}
                              height={10}
                            />{" "}
                            <span className="ml-2">Traitement…</span>
                          </span>
                        ) : (
                          <span className="flex justify-center text-center">
                            {showingTranslateValue(
                              storeCustomizationSetting?.checkout
                                ?.confirm_button
                            )}
                            <span className="text-xl ml-2">
                              {" "}
                              <IoArrowForward />
                            </span>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="md:w-full lg:w-2/5 lg:ml-10 xl:ml-14 md:ml-6 flex flex-col h-full md:sticky lg:sticky top-28 md:order-2 lg:order-2">
              <div className="border p-5 lg:px-8 lg:py-8 rounded-lg bg-white order-1 sm:order-2">
                <h2 className="font-semibold font-serif text-lg pb-4">
                  {showingTranslateValue(
                    storeCustomizationSetting?.checkout?.order_summary
                  )}
                </h2>

                <div className="overflow-y-scroll flex-grow scrollbar-hide w-full max-h-64 bg-gray-50 block">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} currency={currency} />
                  ))}

                  {isEmpty && (
                    <div className="text-center py-10">
                      <span className="flex justify-center my-auto text-gray-500 font-semibold text-4xl">
                        <IoBagHandle />
                      </span>
                      <h2 className="font-medium font-serif text-sm pt-2 text-gray-600">
                        Votre panier est vide
                      </h2>
                    </div>
                  )}
                </div>

                <div className="flex items-center mt-4 py-4 lg:py-4 text-sm w-full font-semibold text-heading last:border-b-0 last:text-base last:pb-0">
                  <form className="w-full">
                    {couponInfo.couponCode ? (
                      <span className="bg-emerald-50 px-4 py-3 leading-tight w-full rounded-md flex justify-between">
                        {" "}
                        <p className="text-emerald-600">Code appliqué </p>{" "}
                        <span className="text-red-500 text-right">
                          {couponInfo.couponCode}
                        </span>
                      </span>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start justify-end">
                        <input
                          ref={couponRef}
                          type="text"
                          placeholder="Code promo"
                          className="form-input py-2 px-3 md:px-4 w-full appearance-none transition ease-in-out border text-input text-sm rounded-md h-12 duration-200 bg-white border-gray-200 focus:ring-0 focus:outline-none focus:border-emerald-500 placeholder-gray-500 placeholder-opacity-75"
                        />
                        {isCouponAvailable ? (
                          <button
                            disabled={isCouponAvailable}
                            type="submit"
                            className="md:text-sm leading-4 inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-semibold text-center justify-center border border-gray-200 rounded-md placeholder-white focus-visible:outline-none focus:outline-none px-5 md:px-6 lg:px-8 py-3 md:py-3.5 lg:py-3 mt-3 sm:mt-0 sm:ml-3 md:mt-0 md:ml-3 lg:mt-0 lg:ml-3 hover:text-white hover:bg-emerald-500 h-12 text-sm lg:text-base w-full sm:w-auto"
                          >
                            <img
                              src="/loader/spinner.gif"
                              alt="Loading"
                              width={20}
                              height={10}
                            />
                            <span className=" ml-2 font-light">Processing</span>
                          </button>
                        ) : (
                          <button
                            disabled={isCouponAvailable}
                            onClick={handleCouponCode}
                            className="md:text-sm leading-4 inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-semibold text-center justify-center border border-gray-200 rounded-md placeholder-white focus-visible:outline-none focus:outline-none px-5 md:px-6 lg:px-8 py-3 md:py-3.5 lg:py-3 mt-3 sm:mt-0 sm:ml-3 md:mt-0 md:ml-3 lg:mt-0 lg:ml-3 hover:text-white hover:bg-emerald-500 h-12 text-sm lg:text-base w-full sm:w-auto"
                          >
                            {showingTranslateValue(
                              storeCustomizationSetting?.checkout?.apply_button
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </form>
                </div>
                <div className="flex items-center py-2 text-sm w-full font-semibold text-gray-500 last:border-b-0 last:text-base last:pb-0">
                  {showingTranslateValue(
                    storeCustomizationSetting?.checkout?.sub_total
                  )}
                  <span className="ml-auto flex-shrink-0 text-gray-800 font-bold">
                    {currency}
                    {cartTotal?.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center py-2 text-sm w-full font-semibold text-gray-500 last:border-b-0 last:text-base last:pb-0">
                  {showingTranslateValue(
                    storeCustomizationSetting?.checkout?.shipping_cost
                  )}
                  <span className="ml-auto flex-shrink-0 font-bold">
                    {qualifiesFreeShipping ? (
                      <span className="text-emerald-600">Offerte</span>
                    ) : (
                      <span className="text-gray-800">
                        {currency}
                        {shippingCost?.toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center py-2 text-sm w-full font-semibold text-gray-500 last:border-b-0 last:text-base last:pb-0">
                  {showingTranslateValue(
                    storeCustomizationSetting?.checkout?.discount
                  )}
                  <span className="ml-auto flex-shrink-0 font-bold text-orange-400">
                    {currency}
                    {discountAmount.toFixed(2)}
                  </span>
                </div>
                <div className="border-t mt-4">
                  <div className="flex items-center font-bold font-serif justify-between pt-5 text-sm uppercase">
                    {showingTranslateValue(
                      storeCustomizationSetting?.checkout?.total_cost
                    )}
                    <span className="font-serif font-extrabold text-lg">
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
