import useUtilsFunction from "@hooks/useUtilsFunction";

const Price = ({ product, price, card, currency, originalPrice }) => {
  // console.log("price", price, "originalPrice", originalPrice, "card", card);
  const { getNumberTwo } = useUtilsFunction();

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
                    ? "ml-1.5 text-base font-normal text-ink-300 line-through sm:text-sm"
                    : "ml-2 text-lg font-normal text-ink-300 line-through"
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
                    ? "ml-1.5 text-base font-normal text-ink-300 line-through sm:text-sm"
                    : "ml-2 text-lg font-normal text-ink-300 line-through"
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
