import Link from "next/link";
import { useCart } from "react-use-cart";
import { IoAdd, IoCheckmark } from "react-icons/io5";

//internal import
import useUtilsFunction from "@hooks/useUtilsFunction";
import useSuggestedProducts from "@hooks/useSuggestedProducts";

const FALLBACK =
  "https://res.cloudinary.com/ahossain/image/upload/v1655097002/placeholder_kvepfp.png";

const SuggestionCard = ({ product, currency }) => {
  const { addItem, inCart } = useCart();
  const { showingTranslateValue } = useUtilsFunction();

  const title = showingTranslateValue(product?.title);
  const price = Number(product?.prices?.price ?? 0);
  const added = inCart(product._id);

  const add = () => {
    if (added) return;
    addItem({
      _id: product._id,
      id: product._id,
      title,
      slug: product.slug,
      image: product.image,
      unit: product.unit,
      price,
      prices: product.prices,
    });
  };

  return (
    <div className="group flex w-40 shrink-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:border-emerald-100 hover:shadow-md">
      <Link
        href={product.slug ? `/product/${product.slug}` : "#"}
        className="grid h-24 place-items-center bg-gray-50/70 p-2"
      >
        <img
          src={product.image?.[0] || FALLBACK}
          alt={title}
          className="h-full w-full object-contain transition duration-200 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-2 min-h-[2.2rem] text-xs font-medium text-gray-700">
          {title}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-800">
            {currency}
            {price.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={add}
            aria-label="Ajouter au panier"
            className={`grid h-8 w-8 place-items-center rounded-full transition ${
              added
                ? "bg-emerald-500 text-white"
                : "border border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white"
            }`}
          >
            {added ? <IoCheckmark /> : <IoAdd />}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * A horizontal, quick-add cross-sell row. Renders nothing when there's nothing relevant to
 * suggest, so it's safe to drop into the cart drawer, checkout modal, etc.
 */
const ProductSuggestions = ({
  title = "Complétez votre commande",
  subtitle,
  limit = 8,
}) => {
  const { suggestions, isLoading } = useSuggestedProducts({ limit });
  const { currency } = useUtilsFunction();

  if (isLoading || suggestions.length === 0) return null;

  return (
    <div>
      {title && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className="gm-rail flex snap-x gap-3 overflow-x-auto pb-1">
        {suggestions.map((p) => (
          <SuggestionCard key={p._id} product={p} currency={currency} />
        ))}
      </div>
    </div>
  );
};

export default ProductSuggestions;
