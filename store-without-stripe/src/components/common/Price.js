import Link from "next/link";
import { FiLock } from "react-icons/fi";

import useUtilsFunction from "@hooks/useUtilsFunction";

/**
 * A product price, or the reason there isn't one.
 *
 * Wholesale prices depend on the buyer's trade, so the API sends none at all to a visitor
 * without a validated account. That arrives as a null price, and this is the single place the
 * storefront turns it into something a shopper can act on - a way in - rather than into
 * "0,00 DH", which would be a lie about what things cost.
 */
const Price = ({ product, price, card, currency, originalPrice }) => {
  const { getNumberTwo } = useUtilsFunction();

  const shown = product?.isCombination ? price : product?.prices?.price;
  const locked =
    product?.priced === false || shown === null || shown === undefined;

  if (locked) {
    return (
      <Link
        href="/auth/login"
        data-no-translate={false}
        className={`inline-flex items-center gap-1.5 rounded-full bg-cream px-3 ${
          card ? "py-1 text-xs" : "py-1.5 text-sm"
        } font-semibold text-emerald-800 transition hover:bg-emerald-50`}
      >
        <FiLock className={card ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" />
        Prix sur compte
      </Link>
    );
  }

  return (
    <div data-no-translate className="product-price font-display font-semibold tabular-nums">
      {product?.isCombination ? (
        <>
          <span
            className={
              card
                ? "inline-block text-lg font-semibold text-ink-900"
                : "inline-block text-3xl text-ink-900"
            }
          >
            {currency}
            {getNumberTwo(price)}
          </span>
          {originalPrice > price ? (
            <>
              <del
                className={
                  card
                    ? "ms-1.5 text-base font-normal text-ink-300 line-through sm:text-sm"
                    : "ms-2 text-lg font-normal text-ink-300 line-through"
                }
              >
                {currency}
                {getNumberTwo(originalPrice)}
              </del>
            </>
          ) : null}
        </>
      ) : (
        <>
          <span
            className={
              card
                ? "inline-block text-lg font-semibold text-ink-900"
                : "inline-block text-3xl text-ink-900"
            }
          >
            {currency}
            {getNumberTwo(product?.prices?.price)}
          </span>
          {originalPrice > price ? (
            <>
              <del
                className={
                  card
                    ? "ms-1.5 text-base font-normal text-ink-300 line-through sm:text-sm"
                    : "ms-2 text-lg font-normal text-ink-300 line-through"
                }
              >
                {currency}
                {getNumberTwo(originalPrice)}
              </del>
            </>
          ) : null}
        </>
      )}
    </div>
  );
};

export default Price;
