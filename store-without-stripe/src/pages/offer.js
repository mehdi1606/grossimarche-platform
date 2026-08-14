import Link from "next/link";
import {
  FiTag,
  FiTruck,
  FiCreditCard,
  FiPercent,
  FiArrowRight,
} from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";

const OFFERS = [
  {
    Icon: FiTag,
    title: "Tarifs dégressifs",
    text: "Plus vous achetez, moins vous payez. Les prix de gros baissent automatiquement selon la quantité — visibles directement sur chaque produit.",
  },
  {
    Icon: FiPercent,
    title: "Codes promo",
    text: "Un code promo ? Saisissez-le dans votre panier au moment de la commande pour appliquer la réduction.",
  },
  {
    Icon: FiCreditCard,
    title: "Paiement à la livraison",
    text: "Commandez en toute confiance et payez à la réception de votre commande.",
  },
  {
    Icon: FiTruck,
    title: "Livraison rapide",
    text: "Livraison de vos commandes en gros partout au Maroc.",
  },
];

const Offer = () => {
  return (
    <Layout title="Offres" description="Offres et avantages Grossimarché">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500">
        <div className="mx-auto max-w-screen-2xl px-4 py-14 text-center sm:px-10 lg:py-20">
          <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            Offres & avantages
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-emerald-50">
            Chez Grossimarché, acheter en gros rime avec économies. Découvrez tout ce qui rend
            vos commandes plus avantageuses.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-screen-2xl px-4 py-14 sm:px-10">
        <div className="grid gap-5 sm:grid-cols-2">
          {OFFERS.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-500">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-gray-500">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl bg-gray-900 px-8 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="font-serif text-xl font-bold text-white">Prêt à commander en gros ?</h3>
            <p className="mt-1 text-sm text-gray-300">
              Parcourez le catalogue et profitez des meilleurs prix.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            Voir les produits <FiArrowRight />
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Offer;
