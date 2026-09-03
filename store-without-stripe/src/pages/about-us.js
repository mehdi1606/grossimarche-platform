import React from "react";
import Link from "next/link";
import { FiTag, FiTruck, FiCreditCard, FiUsers, FiArrowRight } from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";

const STATS = [
  { value: "100%", label: "En ligne" },
  { value: "Maroc", label: "Livraison nationale" },
  { value: "COD", label: "Paiement à la livraison" },
  { value: "Gros", label: "Tarifs dégressifs" },
];

const VALUES = [
  {
    Icon: FiTag,
    title: "Les meilleurs prix",
    text: "Des tarifs de gros compétitifs et dégressifs à la quantité, pour maximiser vos marges.",
  },
  {
    Icon: FiTruck,
    title: "Livraison fiable",
    text: "Vos commandes livrées partout au Maroc, avec un suivi clair de leur statut.",
  },
  {
    Icon: FiCreditCard,
    title: "En toute confiance",
    text: "Payez à la livraison - commandez sans engagement de paiement en ligne.",
  },
  {
    Icon: FiUsers,
    title: "Un service humain",
    text: "Une équipe à votre écoute pour vos commandes, produits et partenariats.",
  },
];

const AboutUs = () => {
  return (
    <Layout title="À propos" description="À propos de Grossimarché">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500">
        <div className="mx-auto max-w-screen-2xl px-4 py-16 text-center sm:px-10 lg:py-24">
          <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            À propos de Grossimarché
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-emerald-50">
            Grossimarché est le marché de gros en ligne du Maroc. Nous simplifions l'achat en
            gros pour les commerçants, restaurateurs et professionnels - au meilleur prix, avec
            une livraison fiable et le paiement à la livraison.
          </p>
        </div>
      </section>

      {/* Stats - same overlap as the home page: `relative z-10` keeps the cards above the
          positioned hero they are pulled onto with -mt-8. */}
      <section className="relative z-10 mx-auto max-w-screen-2xl px-4 sm:px-10">
        <div className="-mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm"
            >
              <p className="font-serif text-2xl font-bold text-emerald-600">{s.value}</p>
              <p className="mt-1 text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-screen-2xl px-4 py-14 sm:px-10">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-2xl font-bold text-gray-800">Notre mission</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Rendre l'approvisionnement en gros simple, transparent et accessible à tous les
            professionnels.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-500">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="text-base font-semibold text-gray-800">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-gray-500">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl bg-gray-900 px-8 py-10 text-center sm:flex-row sm:text-start">
          <div>
            <h3 className="font-serif text-xl font-bold text-white">
              Commencez à commander en gros
            </h3>
            <p className="mt-1 text-sm text-gray-300">
              Des milliers de références vous attendent.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            Découvrir le catalogue <FiArrowRight className="gm-dir-icon" />
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default AboutUs;
