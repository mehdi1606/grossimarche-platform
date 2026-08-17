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
import { deliveryFeeForCity } from "@utils/delivery";

// COD-only checkout against Grossimarché: sync the local cart to the server cart, create a
// delivery address, then POST /orders (idempotent). Card payment (CMI) exists in the
// backend but is hidden for launch. All totals are recomputed server-side; the amounts
// shown here mirror the backend rules (flat delivery fee, waived above the free threshold)
// so the estimate matches the confirmed order.
const FREE_SHIPPING_THRESHOLD = 1000; // MAD — keep in step with backend grossimarche.pricing
const FLAT_DELIVERY_FEE = 30; // MAD

const useCheckoutSubmit = () => {
  const { dispatch } = useContext(UserContext);

  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [couponInfo, setCouponInfo] = useState(
    Cookies.get("couponInfo") ? JSON.parse(Cookies.get("couponInfo")) : {}
  );
  const [showCard, setShowCard] = useState(false);
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

  // The saved profile (GET /me -> { fullName, phone, email }) so a returning customer never
  // retypes their identity. Phone/email are read-only login identities here; changing them
  // needs a fresh OTP (backend /me/contact/*), so we only persist the name.
  const { data: profile } = useQuery({
    queryKey: ["profile", { id: userInfo?.id }],
    queryFn: async () => await CustomerServices.getCustomer(),
    enabled: !!userInfo?.id,
    staleTime: 5 * 60 * 1000,
  });

  const hasShippingAddress = Array.isArray(addresses) && addresses.length > 0;
  const selectedAddress =
    (Array.isArray(addresses) &&
      addresses.find((a) => a.id === selectedAddressId)) ||
    (hasShippingAddress ? addresses[0] : null);

  // Prefill the whole identity block from the saved profile (falling back to the session).
  // Split fullName into first/last for the two-field form; leave anything the user has
  // already typed untouched by only setting empty fields.
  useEffect(() => {
    const fullName = (profile?.fullName || "").trim();
    const [firstName, ...rest] = fullName.split(/\s+/).filter(Boolean);
    setValue("email", profile?.email || userInfo?.email || "");
    if (firstName) setValue("firstName", firstName);
    if (rest.length) setValue("lastName", rest.join(" "));
    if (profile?.phone) setValue("contact", profile.phone);
  }, [profile, userInfo?.email, setValue]);

  // Default-select the saved address so the shopper never re-enters it.
  useEffect(() => {
    if (hasShippingAddress && !selectedAddressId) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [hasShippingAddress, addresses, selectedAddressId]);

  // Delivery mirrors the backend rule: the destination city sets the fee, the free-delivery
  // threshold waives it whatever the city. Derived (never user-selected) so the total shown
  // here matches the one the server recomputes at checkout.
  const qualifiesFreeShipping = Number(cartTotal) >= FREE_SHIPPING_THRESHOLD;
  const cityDeliveryFee = deliveryFeeForCity(selectedAddress?.city, FLAT_DELIVERY_FEE);
  const shippingCost =
    Number(cartTotal) > 0 && !qualifiesFreeShipping ? cityDeliveryFee : 0;
  const freeShippingRemaining = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - Number(cartTotal)
  );

  // total = goods + shipping - coupon discount (server is authoritative at checkout).
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

      // Remember the customer's name on their account so it's prefilled next time. Best-effort:
      // a failure here must never block the order. (Phone/email are OTP-guarded identities and
      // are not changed from checkout.)
      const fullName = [data.firstName, data.lastName]
        .map((s) => (s || "").trim())
        .filter(Boolean)
        .join(" ");
      if (fullName && fullName !== (profile?.fullName || "").trim()) {
        try {
          await CustomerServices.updateCustomer(userInfo?.id, { fullName });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        } catch (_) {
          /* non-blocking */
        }
      }

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
    handleCouponCode,
    discountPercentage: 0,
    discountAmount,
    shippingCost,
    qualifiesFreeShipping,
    freeShippingRemaining,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
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
