/**
 * Delivery zones served by Grossimarché, with their fee.
 *
 * This table mirrors `grossimarche.pricing.city-fees` in the backend configuration — the
 * server recomputes the fee at checkout and is authoritative. Keep both in step: a value
 * changed here alone would only mislead the shopper, never change what is charged.
 */
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
