/**
 * Quantity-tier pricing on the storefront.
 *
 * This mirrors `PricingService.resolveUnitPrice` on the backend, which recomputes every line
 * at checkout and stays authoritative. The duplication is not optional: the backend only
 * applies tiers when the order is placed, so without this the cart shows the base price for a
 * quantity that has already earned a lower one - 4 × 98 DH displayed, 4 × 50 DH charged. A
 * cart that understates the discount is still a cart that lies.
 */

/**
 * The unit price for `quantity` units: the tier with the highest `minQuantity` the quantity
 * reaches, or the base price when it reaches none.
 */
export const effectiveUnitPrice = (basePrice, priceTiers, quantity) => {
  const base = Number(basePrice) || 0;
  const qty = Number(quantity) || 0;
  if (!Array.isArray(priceTiers) || priceTiers.length === 0) return base;

  let best = base;
  let bestMin = 1;
  priceTiers.forEach((tier) => {
    const min = Number(tier?.minQuantity);
    const price = Number(tier?.unitPrice);
    if (!Number.isFinite(min) || !Number.isFinite(price)) return;
    // `>= bestMin` matches the backend: the highest reached tier wins, and ties keep the last
    // one seen, so a re-ordered list cannot change the answer.
    if (qty >= min && min >= bestMin) {
      best = price;
      bestMin = min;
    }
  });
  return best;
};

/** The next tier a shopper has not reached yet, for the "buy N more" nudge. Null when at the best. */
export const nextTier = (priceTiers, quantity) => {
  const qty = Number(quantity) || 0;
  return (
    (priceTiers || [])
      .filter((tier) => Number(tier?.minQuantity) > qty)
      .sort((a, b) => Number(a.minQuantity) - Number(b.minQuantity))[0] || null
  );
};

/**
 * The base price of a cart line.
 *
 * Cart lines carry their tier-adjusted price in `price` so that react-use-cart's own totals
 * are correct everywhere without a parallel calculation. `basePrice` is therefore the only
 * safe input for re-pricing - reading `price` back would compound the discount each time the
 * quantity changed.
 */
export const basePriceOf = (item) =>
  Number(item?.basePrice ?? item?.originalPrice ?? item?.price) || 0;

/** Whether a line is currently getting a quantity discount. */
export const hasTierDiscount = (item) =>
  effectiveUnitPrice(basePriceOf(item), item?.priceTiers, item?.quantity) <
  basePriceOf(item);
