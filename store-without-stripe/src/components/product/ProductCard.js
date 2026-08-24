import dynamic from "next/dynamic";
import { useState } from "react";
import { IoAdd, IoBagAddSharp, IoRemove } from "react-icons/io5";
import { FiTrendingDown } from "react-icons/fi";
import { useCart } from "react-use-cart";

//internal import

import Price from "@components/common/Price";
import Stock from "@components/common/Stock";
import useAddToCart from "@hooks/useAddToCart";
import useGetSetting from "@hooks/useGetSetting";
import Discount from "@components/common/Discount";
import useUtilsFunction from "@hooks/useUtilsFunction";
import ProductModal from "@components/modal/ProductModal";
import ProductImage from "@components/product/ProductImage";
import { handleLogEvent } from "src/lib/analytics";

const ProductCard = ({ product, attributes }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const { items, inCart } = useCart();
  const {
    handleAddItem,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    minOf,
  } = useAddToCart();
  const { globalSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();

  const currency = globalSetting?.default_currency || "$";
  const minQuantity = minOf(product);
  // The next quantity break, if the shopper is not already on the best tier. Showing it on
  // the card is what turns a wholesale price list into a reason to buy more.
  const nextTier = (product?.priceTiers || [])
    .filter((t) => Number(t.minQuantity) > minQuantity)
    .sort((a, b) => Number(a.minQuantity) - Number(b.minQuantity))[0];

  /**
   * Adding from the grid goes through `useAddToCart` like every other entry point, so the
   * shopper gets the same confirmation, the same stock check and the same minimum-order rule.
   * This used to be a private copy that added silently — no toast, no drawer, no minimum.
   */
  const addToCart = (p) => {
    if (p?.variants?.length > 0) {
      setModalOpen(true);
      return;
    }
    const { slug, variants, categories, description, ...rest } = p;
    handleAddItem({
      ...rest,
      slug,
      id: p._id,
      title: showingTranslateValue(p?.title),
      image: p.image?.[0] || "",
      variant: p.prices,
      price: p.prices.price,
      originalPrice: p.prices?.originalPrice,
    });
  };

  return (
    <>
      {modalOpen && (
        <ProductModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          product={product}
          currency={currency}
          attributes={attributes}
        />
      )}

      <div className="group relative box-border flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-luxe transition duration-300 ease-out hover:-translate-y-1 hover:border-emerald-200 hover:shadow-luxe-lg">
        <div className="absolute inset-x-0 top-0 z-10 flex justify-between p-2.5">
          <Stock product={product} stock={product.stock} card />
          <Discount product={product} />
        </div>
        <button
          type="button"
          onClick={() => {
            setModalOpen(true);
            handleLogEvent(
              "product",
              `opened ${showingTranslateValue(product?.title)} product modal`
            );
          }}
          aria-label={`Voir ${showingTranslateValue(product?.title)}`}
          className="block w-full cursor-pointer"
        >
          <ProductImage
            src={product.image?.[0]}
            alt={showingTranslateValue(product?.title)}
            unit={product.unit}
            className="aspect-square"
          />
        </button>

        <div className="flex w-full flex-1 flex-col overflow-hidden px-3.5 pb-4 lg:px-4">
          <div className="relative mb-1 pt-3">
            <span className="mb-1 block text-2xs font-medium uppercase tracking-luxe text-ink-400">
              {product.unit}
            </span>
            <h2 className="mb-0 block text-sm font-medium text-ink-700">
              <span className="line-clamp-2">
                {showingTranslateValue(product?.title)}
              </span>
            </h2>
          </div>

          {/* Wholesale signals: the quantity break first — it is the reason to buy a case —
              then the minimum order. */}
          <div className="mb-3 mt-2 min-h-[1.5rem] space-y-1.5">
            {nextTier && (
              <span
                data-no-translate
                className="inline-flex items-center gap-1.5 rounded-full bg-brass-50 px-2.5 py-1 text-2xs font-semibold text-brass-600 ring-1 ring-inset ring-brass-200"
              >
                <FiTrendingDown className="h-3 w-3" />
                Dès {nextTier.minQuantity} · {currency}
                {Number(nextTier.unitPrice).toFixed(2)}
              </span>
            )}
            {minQuantity > 1 && (
              <p className="text-2xs font-medium text-ink-400">
                Commande minimum : {minQuantity} {product.unit || "u."}
              </p>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 text-sm sm:text-base">
            <Price
              card
              product={product}
              currency={currency}
              price={
                product?.isCombination
                  ? product?.variants[0]?.price
                  : product?.prices?.price
              }
              originalPrice={
                product?.isCombination
                  ? product?.variants[0]?.originalPrice
                  : product?.prices?.originalPrice
              }
            />

            {inCart(product._id) ? (
              <div>
                {items.map(
                  (item) =>
                    item.id === product._id && (
                      <div
                        key={item.id}
                        className="flex h-9 w-auto flex-wrap items-center justify-evenly rounded-lg bg-emerald-600 px-2 py-1 text-white shadow-sm"
                      >
                        <button
                          aria-label="Retirer une unité"
                          onClick={() => handleDecreaseQuantity(item)}
                          className="grid h-6 w-6 place-items-center rounded transition hover:bg-white/15"
                        >
                          <IoRemove />
                        </button>
                        <p className="px-1 text-sm font-semibold tabular-nums">
                          {item.quantity}
                        </p>
                        <button
                          aria-label="Ajouter une unité"
                          onClick={() =>
                            item?.variants?.length > 0
                              ? addToCart(item)
                              : handleIncreaseQuantity(item)
                          }
                          className="grid h-6 w-6 place-items-center rounded transition hover:bg-white/15"
                        >
                          <IoAdd />
                        </button>
                      </div>
                    )
                )}
              </div>
            ) : (
              <button
                onClick={() => addToCart(product)}
                disabled={product.stock < 1}
                aria-label="Ajouter au panier"
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-emerald-600 transition-all hover:border-emerald-600 hover:bg-emerald-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-emerald-600"
              >
                <span className="text-xl">
                  <IoBagAddSharp />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default dynamic(() => Promise.resolve(ProductCard), { ssr: false });
