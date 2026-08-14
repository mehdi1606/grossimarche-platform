import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useCart } from "react-use-cart";
import { useQuery, useQueryClient } from "@tanstack/react-query";

//internal import
import { getUserSession } from "@lib/auth";
import { UserContext } from "@context/UserContext";
import OrderServices from "@services/OrderServices";
import CartServices from "@services/CartServices";
import useUtilsFunction from "./useUtilsFunction";
import CouponServices from "@services/CouponServices";
import { notifyError, notifySuccess } from "@utils/toast";
import CustomerServices from "@services/CustomerServices";

// COD-only checkout against Grossimarché: sync the local cart to the server cart, create a
// delivery address, then POST /orders (idempotent). Card payment (CMI) exists in the
// backend but is hidden for launch. All totals are recomputed server-side; the amounts
// shown here are estimates until the order confirmation.
const useCheckoutSubmit = () => {
  const { dispatch } = useContext(UserContext);

  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [couponInfo, setCouponInfo] = useState(
    Cookies.get("couponInfo") ? JSON.parse(Cookies.get("couponInfo")) : {}
  );
  const [showCard, setShowCard] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(
    Cookies.get("couponInfo")
      ? JSON.parse(Cookies.get("couponInfo"))?.discountAmount || 0
      : 0
  );
  const [isCheckoutSubmit, setIsCheckoutSubmit] = useState(false);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [useExistingAddress, setUseExistingAddress] = useState(false);
  const [isCouponAvailable, setIsCouponAvailable] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const router = useRouter();
  const queryClient = useQueryClient();
  const couponRef = useRef("");
  const { isEmpty, emptyCart, items, cartTotal } = useCart();

  const userInfo = getUserSession();
  const { currency, globalSetting } = useUtilsFunction();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  // Existing saved addresses (GET /me/addresses -> array).
  const { data: addresses, isLoading: addressLoading } = useQuery({
    queryKey: ["shippingAddress", { id: userInfo?.id }],
    queryFn: async () => await CustomerServices.getShippingAddress(),
    enabled: !!userInfo?.id,
  });

  const hasShippingAddress = Array.isArray(addresses) && addresses.length > 0;
  const selectedAddress =
    (Array.isArray(addresses) &&
      addresses.find((a) => a.id === selectedAddressId)) ||
    (hasShippingAddress ? addresses[0] : null);

  useEffect(() => {
    setValue("email", userInfo?.email);
  }, [userInfo?.email, setValue]);

  // Default-select the saved address so the shopper never re-enters it.
  useEffect(() => {
    if (hasShippingAddress && !selectedAddressId) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [hasShippingAddress, addresses, selectedAddressId]);

  // total = goods + shipping estimate - coupon discount (server is authoritative at checkout).
  useEffect(() => {
    const value = Number(cartTotal) + Number(shippingCost) - Number(discountAmount);
    setTotal(value > 0 ? value : 0);
  }, [cartTotal, shippingCost, discountAmount]);

  // Drop the coupon if the cart empties.
  useEffect(() => {
    if (isEmpty) {
      setDiscountAmount(0);
      setCouponInfo({});
      Cookies.remove("couponInfo");
    }
  }, [isEmpty]);

  const buildAddress = (data) => {
    const parts = [data.address, data.zipCode, data.country].filter(Boolean);
    return {
      label: "Livraison",
      city: data.city,
      addressLine: parts.join(", ").slice(0, 255),
      isDefault: true,
    };
  };

  // Persist a new delivery address (from the modal), then select it and continue the flow.
  const saveAddress = async (data) => {
    setSavingAddress(true);
    try {
      const created = await CustomerServices.addShippingAddress({
        shippingAddressData: buildAddress(data),
      });
      await queryClient.invalidateQueries({ queryKey: ["shippingAddress"] });
      if (created?.id) setSelectedAddressId(created.id);
      setAddressModalOpen(false);
      notifySuccess("Adresse enregistrée.");
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSavingAddress(false);
    }
  };

  const submitHandler = async (data) => {
    try {
      setError("");

      // A delivery address is required. If the shopper has none saved, guide them into the
      // modal instead of failing — no re-entry when an address already exists.
      const addressId = selectedAddressId || selectedAddress?.id;
      if (!addressId) {
        setAddressModalOpen(true);
        return;
      }

      setIsCheckoutSubmit(true);

      // Sync the local cart to the server cart (checkout reads the server cart)
      await CartServices.syncFromLocal(items);

      // Place the order (COD), idempotent
      const orderPayload = {
        addressId,
        paymentMethod: "COD",
        note: data.orderNote || "",
        couponCode: couponInfo?.couponCode || null,
      };
      const res = await OrderServices.addOrder(orderPayload, {
        headers: { "Idempotency-Key": crypto.randomUUID() },
      });

      const orderId = res?.order?.id;
      notifySuccess("Commande confirmée (paiement à la livraison) !");
      Cookies.remove("couponInfo");
      emptyCart();
      setIsCheckoutSubmit(false);
      if (orderId) router.push(`/order/${orderId}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message;
      setError(msg);
      notifyError(msg);
      setIsCheckoutSubmit(false);
    }
  };

  const handleShippingCost = (value) => {
    setShippingCost(Number(value));
  };

  const handleCouponCode = async (e) => {
    e.preventDefault();
    const code = couponRef.current?.value?.trim();
    if (!code) {
      return notifyError("Veuillez saisir un code promo.");
    }
    if (isEmpty) {
      return notifyError("Votre panier est vide.");
    }
    setIsCouponAvailable(true);
    try {
      // The coupon is validated against the server cart, so sync it first.
      await CartServices.syncFromLocal(items);
      const preview = await CouponServices.validate({ code });
      if (!preview?.valid) {
        setDiscountAmount(0);
        setCouponInfo({});
        Cookies.remove("couponInfo");
        return notifyError(preview?.message || "Code promo invalide.");
      }
      const applied = {
        couponCode: preview.code,
        discountAmount: Number(preview.discountAmount) || 0,
      };
      setCouponInfo(applied);
      setDiscountAmount(applied.discountAmount);
      setIsCouponApplied((v) => !v);
      Cookies.set("couponInfo", JSON.stringify(applied));
      dispatch({ type: "SAVE_COUPON", payload: applied });
      notifySuccess(
        preview.message || `Code ${applied.couponCode} appliqué (−${applied.discountAmount}).`
      );
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setIsCouponAvailable(false);
    }
  };

  // Prefill from a saved address (Grossimarché address = { addressLine, city }).
  const handleDefaultShippingAddress = (value) => {
    setUseExistingAddress(value);
    const a = hasShippingAddress ? addresses[0] : null;
    if (value && a) {
      setValue("address", a.addressLine || "");
      setValue("city", a.city || "");
    } else {
      setValue("address", "");
      setValue("city", "");
    }
  };

  return {
    register,
    errors,
    showCard,
    setShowCard,
    error,
    couponInfo,
    couponRef,
    total,
    isEmpty,
    items,
    cartTotal,
    currency,
    globalSetting,
    handleSubmit,
    submitHandler,
    handleShippingCost,
    handleCouponCode,
    discountPercentage: 0,
    discountAmount,
    shippingCost,
    isCheckoutSubmit,
    isCouponApplied,
    useExistingAddress,
    hasShippingAddress,
    isCouponAvailable,
    handleDefaultShippingAddress,
    // address modal + selection
    addresses,
    addressLoading,
    selectedAddress,
    selectedAddressId,
    setSelectedAddressId,
    addressModalOpen,
    setAddressModalOpen,
    saveAddress,
    savingAddress,
  };
};

export default useCheckoutSubmit;
