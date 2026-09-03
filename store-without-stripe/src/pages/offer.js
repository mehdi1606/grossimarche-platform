import Link from "next/link";
import {
  FiArrowRight,
  FiCreditCard,
  FiPackage,
  FiPercent,
  FiTag,
  FiTruck,
} from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";
import useBundles from "@hooks/useBundles";
import BundleCard from "@components/bundle/BundleCard";
import CMSkeletonTwo from "@components/preloader/CMSkeletonTwo";

// The standing commercial terms, below the offers themselves. These are always true, so they
// belong under the thing that changes rather than in place of it.
const ADVANTAGES = [
  {
    Icon: FiTag,
    title: "Tarifs dégressifs",
    text: "Plus vous achetez, moins vous payez : le prix unitaire baisse automatiquement selon la quantité, sur chaque produit.",
  },
  {
    Icon: FiPercent,
    title: "Codes promo",
    text: "Un code promo ? Saisissez-le au moment de la commande pour appliquer la réduction.",
  },
  {
    Icon: FiCreditCard,
    title: "Paiement à la livraison",
    text: "Commandez en toute confiance et payez à la réception de votre commande.",
  },
  {
    Icon: FiTruck,
    title: "Livraison offerte dès 1000 DH",
    text: "Au-delà du seuil, la livraison ne vous coûte rien, quelle que soit la ville.",
  },
];

const Offer = () => {
  const { bundles, isLoading, addBundleToCart, addingId } = useBundles();

  return (
    <Layout
      title="Offres"
      description="Paniers et offres Grossimarché - des ensembles complets à prix de gros"
    >
      {/* Hero */}
      <section className="relative overflow-hidden bg-emerald-800">
        <div className="gm-float pointer-events-none absolute -end-16 -top-16 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative mx-auto max-w-screen-2xl px-4 py-20 text-center sm:px-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-2xs font-medium uppercase tracking-luxe text-emerald-50 ring-1 ring-white/20">
            <FiPackage /> Nos paniers
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Des paniers complets, à prix de gros.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-emerald-100/90">
            Des ensembles prêts à commander : tout ce qu'il faut, en une fois, pour
            moins cher que les articles pris séparément.
          </p>
        </div>
      </section>

      {/* Bundles */}
      <section className="bg-cream">
        <div className="mx-auto max-w-screen-2xl px-4 py-20 sm:px-10">
          {isLoading ? (
            <CMSkeletonTwo count={12} width={100} loading={isLoading} />
          ) : bundles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white px-6 py-20 text-center">
              <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <FiPackage className="text-2xl" />
              </span>
              <h2 className="font-display text-lg font-semibold text-ink-800">
                Aucun panier pour le moment
              </h2>
              <p className="mt-1 max-w-sm text-sm text-ink-500">
                De nouvelles offres arrivent régulièrement. En attendant, les tarifs
                dégressifs s'appliquent déjà sur tout le catalogue.
              </p>
              <Link
                href="/search"
                className="mt-6 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                Découvrir les produits
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900">
                    Paniers du moment
                  </h2>
                  <p className="mt-2 text-sm text-ink-500">
                    Ajoutez un panier entier en un clic - la remise s'applique
                    automatiquement à la commande.
                  </p>
                </div>
                <Link
                  href="/search"
                  className="hidden items-center gap-1 text-sm font-medium text-emerald-700 hover:underline sm:flex"
                >
                  Tout le catalogue <FiArrowRight className="gm-dir-icon" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {bundles.map((bundle) => (
                  <BundleCard
                    key={bundle.id}
                    bundle={bundle}
                    onAdd={addBundleToCart}
                    adding={addingId === bundle.id}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Standing advantages */}
      <section className="bg-white">
        <div className="mx-auto max-w-screen-2xl px-4 py-20 sm:px-10">
          <h2 className="mb-10 font-display text-2xl font-semibold tracking-tight text-ink-900">
            Toujours inclus
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ADVANTAGES.map(({ Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-line bg-cream p-6 transition hover:border-emerald-200"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink-800">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Offer;
