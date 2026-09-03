import React from "react";
import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/solid";

//internal import
import Layout from "@layout/Layout";

const FAQS = [
  {
    q: "Comment passer une commande ?",
    a: "Parcourez le catalogue, ajoutez vos produits au panier puis validez la commande. Vous devez être connecté (par code à usage unique) pour finaliser.",
  },
  {
    q: "Comment fonctionne le paiement à la livraison ?",
    a: "Vous réglez le montant de votre commande directement au livreur, à la réception. Aucun paiement en ligne n'est requis.",
  },
  {
    q: "Qu'est-ce que les tarifs dégressifs ?",
    a: "Plus vous commandez en quantité, plus le prix unitaire baisse. Les paliers de prix sont affichés directement sur la fiche de chaque produit.",
  },
  {
    q: "Quels sont les délais de livraison ?",
    a: "Nous livrons vos commandes en gros partout au Maroc. Le délai dépend de votre ville ; il vous est communiqué lors de la commande.",
  },
  {
    q: "Y a-t-il un minimum de commande ?",
    a: "Certains produits ont une quantité minimale de commande, indiquée sur leur fiche. Sinon, vous commandez la quantité de votre choix.",
  },
  {
    q: "Comment utiliser un code promo ?",
    a: "Saisissez votre code promo dans le panier avant de valider la commande : la réduction est appliquée automatiquement si le code est valide.",
  },
  {
    q: "Comment suivre mes commandes ?",
    a: "Depuis votre espace client, rubrique « Mes commandes », vous retrouvez l'historique et le statut de chacune de vos commandes.",
  },
  {
    q: "Comment vous contacter ?",
    a: "Écrivez-nous à contact@grossimarche.ma ou via la page Contact. Notre équipe vous répond rapidement.",
  },
];

const Faq = () => {
  return (
    <Layout title="FAQ" description="Questions fréquentes Grossimarché">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500">
        <div className="mx-auto max-w-screen-2xl px-4 py-14 text-center sm:px-10 lg:py-20">
          <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            Questions fréquentes
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-emerald-50">
            Tout ce qu'il faut savoir pour commander en gros sur Grossimarché.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-10">
        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <Disclosure key={i}>
              {({ open }) => (
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                  <Disclosure.Button className="flex w-full items-center justify-between px-5 py-4 text-start text-base font-medium text-gray-800 transition hover:bg-gray-50 focus:outline-none">
                    <span>{item.q}</span>
                    <ChevronUpIcon
                      className={`${
                        open ? "rotate-180 text-emerald-500" : ""
                      } h-5 w-5 shrink-0 text-gray-400 transition-transform`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-5 pb-5 text-sm leading-7 text-gray-500">
                    {item.a}
                  </Disclosure.Panel>
                </div>
              )}
            </Disclosure>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Faq;
