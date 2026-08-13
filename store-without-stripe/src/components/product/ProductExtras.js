import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

//internal import
import ReviewServices from "@services/ReviewServices";
import { notifyError, notifySuccess } from "@utils/toast";

const Stars = ({ value = 0 }) => {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span aria-label={`${value} sur 5`}>
      <span className="text-amber-400">{"★".repeat(full)}</span>
      <span className="text-gray-300">{"★".repeat(5 - full)}</span>
    </span>
  );
};

// Product-detail extras: informational attributes + moderated reviews with a submit form.
const ProductExtras = ({ product }) => {
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const productId = product?._id;
  const attributes = product?.attributes ?? [];

  const { data: reviewsPage, refetch } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => ReviewServices.getByProduct(productId),
    enabled: !!productId,
  });
  const reviews = reviewsPage?.content ?? [];

  const submit = async (e) => {
    e.preventDefault();
    if (!session?.user) {
      return notifyError("Connectez-vous pour laisser un avis.");
    }
    setSubmitting(true);
    try {
      await ReviewServices.submit(productId, { rating: Number(rating), comment });
      notifySuccess("Merci ! Votre avis sera publié après modération.");
      setComment("");
      refetch();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Attributes */}
      <div>
        <h3 className="text-lg font-semibold font-serif mb-4">Caractéristiques</h3>
        {attributes.length ? (
          <table className="w-full text-sm border border-gray-100 rounded overflow-hidden">
            <tbody className="divide-y divide-gray-100">
              {attributes.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 text-gray-500 font-medium w-1/3 bg-gray-50">
                    {a.name}
                  </td>
                  <td className="px-4 py-2 text-gray-800">{a.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">Aucune caractéristique renseignée.</p>
        )}
      </div>

      {/* Reviews */}
      <div>
        <h3 className="text-lg font-semibold font-serif mb-2">
          Avis {product?.reviewCount ? `(${product.reviewCount})` : ""}
        </h3>
        <div className="mb-4 flex items-center gap-2">
          <Stars value={product?.averageRating || 0} />
          <span className="text-sm text-gray-500">
            {(Number(product?.averageRating) || 0).toFixed(1)} / 5
          </span>
        </div>

        <ul className="space-y-3 mb-6 max-h-64 overflow-y-auto">
          {reviews.length ? (
            reviews.map((r) => (
              <li key={r.id} className="border border-gray-100 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm text-gray-700">
                    {r.authorName}
                  </span>
                  <Stars value={r.rating} />
                </div>
                {r.comment && (
                  <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                )}
              </li>
            ))
          ) : (
            <p className="text-sm text-gray-400">
              Soyez le premier à donner votre avis.
            </p>
          )}
        </ul>

        {session?.user ? (
          <form onSubmit={submit} className="space-y-2">
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </select>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Votre avis…"
              rows={3}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
            <button
              disabled={submitting}
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-5 py-2 rounded disabled:opacity-70"
            >
              {submitting ? "Envoi…" : "Publier mon avis"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500">
            <Link href="/auth/login" className="text-emerald-600 underline">
              Connectez-vous
            </Link>{" "}
            pour laisser un avis.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductExtras;
