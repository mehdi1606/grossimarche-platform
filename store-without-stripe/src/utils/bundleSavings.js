/**
 * The bundle saving a cart has earned, for display only.
 *
 * This mirrors `BundleService.computeDiscount` on the backend, which stays authoritative - it
 * recomputes the discount at checkout against live prices and is what the customer is actually
 * charged. The duplication buys one thing worth having: the shopper sees "offre panier
 * appliquée" while filling the cart, rather than discovering a lower total after ordering.
 *
 * Two rules are copied deliberately, because getting them wrong would over-promise:
 *   - only complete sets count;
 *   - units are consumed, richest offer first, so a product in two offers is only discounted
 *     once.
 */
export const bundleSavingsForCart = (bundles = [], cartItems = []) => {
  const remaining = new Map();
  cartItems.forEach((item) => {
    const id = item._id || item.id;
    remaining.set(id, (remaining.get(id) || 0) + Number(item.quantity || 0));
  });

  const priced = bundles
    .filter((bundle) => bundle?.available && Number(bundle.savings) > 0)
    .map((bundle) => ({ bundle, perSet: Number(bundle.savings) }))
    .sort((a, b) => b.perSet - a.perSet);

  let total = 0;
  const applied = [];

  priced.forEach(({ bundle, perSet }) => {
    const items = bundle.items || [];
    if (items.length === 0) return;

    let sets = Infinity;
    items.forEach((item) => {
      const have = remaining.get(item.productId) || 0;
      sets = Math.min(sets, Math.floor(have / item.quantity));
    });
    if (!Number.isFinite(sets) || sets <= 0) return;

    items.forEach((item) => {
      remaining.set(item.productId, (remaining.get(item.productId) || 0) - item.quantity * sets);
    });
    total += perSet * sets;
    applied.push({ id: bundle.id, name: bundle.name, sets, discount: perSet * sets });
  });

  return { total, applied };
};

/**
 * How close the cart is to completing an offer - used to nudge ("il vous manque 2 × X").
 * Returns null once the set is already complete, so callers can simply skip a null.
 */
export const missingForBundle = (bundle, cartItems = []) => {
  const have = new Map();
  cartItems.forEach((item) => {
    const id = item._id || item.id;
    have.set(id, (have.get(id) || 0) + Number(item.quantity || 0));
  });

  const missing = (bundle?.items || [])
    .map((item) => ({ ...item, missing: item.quantity - (have.get(item.productId) || 0) }))
    .filter((item) => item.missing > 0);

  return missing.length === 0 ? null : missing;
};
