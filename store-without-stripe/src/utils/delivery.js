/**
 * Delivery zones served by Grossimarché, with their fee.
 *
 * This table mirrors `grossimarche.pricing.city-fees` in the backend configuration — the
 * server recomputes the fee at checkout and is authoritative. Keep both in step: a value
 * changed here alone would only mislead the shopper, never change what is charged.
 */
/**
 * Free-delivery threshold and the fallback flat fee, in MAD.
 *
 * These mirror `grossimarche.pricing` in the backend, which recomputes both at checkout and
 * is authoritative. They live here — not inline in the cart and again in the checkout hook —
 * so the drawer's "plus que X pour la livraison offerte" can never drift from the total the
 * customer is actually charged.
 */
export const FREE_SHIPPING_THRESHOLD = 1000;
export const FLAT_DELIVERY_FEE = 30;

export const DELIVERY_CITIES = [
  { city: "Mohammedia", fee: 0 },
  { city: "Casablanca", fee: 20 },
  { city: "Benslimane", fee: 30 },
];

/** Fee for a city name, whatever its casing/spacing. Unknown city → the flat fallback fee. */
export const deliveryFeeForCity = (city, fallbackFee) => {
  const match = DELIVERY_CITIES.find(
    (entry) => entry.city.toLowerCase() === String(city || "").trim().toLowerCase()
  );
  return match ? match.fee : fallbackFee;
};

/** "Gratuite" / "20 DH" — the label shown next to a city in the picker. */
export const deliveryFeeLabel = (fee, currency = "DH") =>
  Number(fee) === 0 ? "Livraison offerte" : `Livraison ${fee} ${currency}`;

/**
 * The shipping line for a given basket, in one place.
 *
 * `city` is optional: before an address is chosen we quote the flat fallback fee, which is
 * the highest of the served zones, so the estimate can only ever come down.
 */
export const shippingEstimate = (cartTotal, city) => {
  const goods = Number(cartTotal) || 0;
  const qualifiesFree = goods >= FREE_SHIPPING_THRESHOLD;
  const cityFee = deliveryFeeForCity(city, FLAT_DELIVERY_FEE);
  return {
    qualifiesFree,
    cityFee,
    // An empty basket is never charged delivery.
    cost: goods > 0 && !qualifiesFree ? cityFee : 0,
    remaining: Math.max(0, FREE_SHIPPING_THRESHOLD - goods),
    progress: Math.min(100, (goods / FREE_SHIPPING_THRESHOLD) * 100),
  };
};

/**
 * A delivery *date*, not a vague range — shoppers plan around a day, and a concrete promise
 * is what removes the "when will it arrive?" hesitation at checkout.
 *
 * Orders placed before the 14h cut-off ship next day; after it, the day after. Sunday is not
 * a delivery day, so it rolls to Monday.
 */
export const estimatedDeliveryDate = (from = new Date()) => {
  const date = new Date(from);
  date.setDate(date.getDate() + (date.getHours() < 14 ? 1 : 2));
  if (date.getDay() === 0) {
    date.setDate(date.getDate() + 1);
  }
  return date;
};

/** "jeudi 24 août" — the human label for {@link estimatedDeliveryDate}. */
export const estimatedDeliveryLabel = (from = new Date()) =>
  estimatedDeliveryDate(from).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
