import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { FiClipboard, FiMessageSquare } from "react-icons/fi";

//internal import
import ReviewServices from "@services/ReviewServices";
import { notifyError, notifySuccess } from "@utils/toast";

/** Read-only rating, rounded to the nearest star. */
const Stars = ({ value = 0, className = "h-4 w-4" }) => {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} sur 5`}>
      {[...Array(5)].map((_, i) =>
        i < full ? (
          <IoStar key={i} className={`${className} text-brass-400`} />
        ) : (
          <IoStarOutline key={i} className={`${className} text-ink-200`} />
        )
      )}
    </span>
  );
};

// What each score means, so the shopper picks a number that says what they mean.
const RATING_LABELS = {
  1: "Décevant",
  2: "Moyen",
  3: "Correct",
  4: "Très bien",
  5: "Excellent",
};

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

/**
 * Product-detail extras: the informational attributes, and the moderated reviews.
 *
 * Both were bare template markup - a grey table, a rating chosen from a dropdown, an unlabelled
 * textarea - sitting on a page built from cards. They are now two cards like the rest of the
 * page, the rating is picked by clicking a star, and a review carries the date it was left.
 */
const ProductExtras = ({ product }) => {
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
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
  const average = Number(product?.averageRating) || 0;
  const count = product?.reviewCount || 0;

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

  const cardCls = "rounded-2xl border border-line bg-white p-6 shadow-luxe";
  const headingCls = "flex items-center gap-2 text-lg font-semibold text-ink-900";

  return (
    <section className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Attributes */}
      <div className={`${cardCls} lg:col-span-2`}>
        <h3 className={headingCls}>
          <FiClipboard className="h-4 w-4 text-ink-400" />
          Caractéristiques
        </h3>

        {attributes.length ? (
          <dl className="mt-4 divide-y divide-line">
            {attributes.map((a) => (
              <div key={a.id} className="flex items-baseline justify-between gap-6 py-3">
                <dt className="text-sm text-ink-500">{a.name}</dt>
                <dd className="text-end text-sm font-medium text-ink-800">{a.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-cream px-4 py-8 text-center">
            <p className="text-sm text-ink-500">Aucune caractéristique renseignée.</p>
            <p className="mt-1 text-xs text-ink-400">
              Une question sur ce produit ? Notre équipe répond au 05 22 00 00 00.
            </p>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className={`${cardCls} lg:col-span-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={headingCls}>
            <FiMessageSquare className="h-4 w-4 text-ink-400" />
            Avis
          </h3>
          <span className="rounded-full bg-sand px-2.5 py-1 text-2xs font-semibold uppercase tracking-luxe text-ink-500">
            {count} avis
          </span>
        </div>

        {/* The score, read at a glance instead of counted star by star. */}
        <div className="mt-4 flex items-center gap-4 rounded-xl bg-cream px-4 py-3">
          <span className="font-display text-3xl font-semibold leading-none text-ink-900">
            {average.toFixed(1)}
          </span>
          <div>
            <Stars value={average} />
            <p className="mt-1 text-xs text-ink-400">
              {count === 0
                ? "Aucune note pour le moment"
                : `Moyenne sur ${count} avis client${count > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {reviews.length > 0 && (
          <ul className="mt-5 max-h-80 space-y-3 overflow-y-auto pe-1">
            {reviews.map((r) => {
              const name = r.authorName || "Client";
              const date = formatDate(r.createdAt);
              return (
                <li key={r.id} className="rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-sm font-semibold uppercase text-emerald-700">
                        {name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-800">{name}</p>
                        {date && <p className="text-xs text-ink-400">{date}</p>}
                      </div>
                    </div>
                    <Stars value={r.rating} className="h-3.5 w-3.5" />
                  </div>
                  {r.comment && (
                    <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-ink-600">
                      {r.comment}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {session?.user ? (
          <form onSubmit={submit} className="mt-6 border-t border-line pt-5">
            <p className="text-sm font-medium text-ink-700">
              {reviews.length ? "Donnez votre avis" : "Soyez le premier à donner votre avis"}
            </p>

            {/* A rating is clicked, not chosen from a dropdown. */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHovered(n)}
                    aria-label={`${n} étoile${n > 1 ? "s" : ""} - ${RATING_LABELS[n]}`}
                    aria-pressed={rating === n}
                    className="rounded p-0.5 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  >
                    {n <= (hovered || rating) ? (
                      <IoStar className="h-6 w-6 text-brass-400" />
                    ) : (
                      <IoStarOutline className="h-6 w-6 text-ink-200" />
                    )}
                  </button>
                ))}
              </div>
              <span className="text-sm text-ink-500">{RATING_LABELS[hovered || rating]}</span>
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Qualité, emballage, livraison... ce qui aiderait un autre commerçant."
              rows={3}
              maxLength={500}
              className="mt-3 w-full resize-y rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink-800 placeholder-ink-300 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ink-400">
                Publié après validation - {500 - comment.length} caractères restants.
              </p>
              <button
                disabled={submitting}
                type="submit"
                className="inline-flex h-11 items-center rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {submitting ? "Envoi..." : "Publier mon avis"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-line bg-cream px-4 py-6 text-center">
            <p className="text-sm text-ink-600">
              Vous avez acheté ce produit ? Votre avis aide les autres commerçants.
            </p>
            <Link
              href="/auth/login"
              className="mt-3 inline-flex h-11 items-center rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600"
            >
              Se connecter pour laisser un avis
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductExtras;
