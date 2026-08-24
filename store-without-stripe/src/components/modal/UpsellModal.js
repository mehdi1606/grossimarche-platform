import { useCart } from "react-use-cart";
import { IoClose, IoArrowForward, IoBagAddSharp } from "react-icons/io5";

//internal import
import useUtilsFunction from "@hooks/useUtilsFunction";
import ProductSuggestions from "@components/product/ProductSuggestions";

/**
 * Last-chance cross-sell shown right before the order is placed. The shopper can add a few
 * more items (the cart total updates live) and then confirm, or skip straight to confirming.
 */
const UpsellModal = ({ isOpen, onClose, onConfirm, submitting }) => {
  const { cartTotal, totalItems } = useCart();
  const { currency } = useUtilsFunction();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-500">
              <IoBagAddSharp className="text-xl" />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-gray-800">
                Avant de valider…
              </h2>
              <p className="text-sm text-gray-500">
                Ajoutez ces produits souvent commandés ensemble.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        {/* Suggestions */}
        <div className="flex-1 overflow-y-auto p-5">
          <ProductSuggestions title="" limit={8} surface="white" />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-5">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {totalItems} article{totalItems > 1 ? "s" : ""} — total
            </span>
            <span className="text-lg font-bold text-gray-800">
              {currency}
              {cartTotal.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button
              onClick={onConfirm}
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 disabled:opacity-70"
            >
              {submitting ? "Traitement…" : "Confirmer ma commande"}
              {!submitting && <IoArrowForward />}
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-300"
            >
              Continuer mes achats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpsellModal;
