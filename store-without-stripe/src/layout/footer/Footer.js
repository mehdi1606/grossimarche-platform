import Link from "next/link";
import dynamic from "next/dynamic";
import {
  FiFacebook,
  FiInstagram,
  FiTwitter,
  FiMail,
  FiPhone,
  FiShoppingCart,
} from "react-icons/fi";

//internal import
import { getUserSession } from "@lib/auth";

const COLUMNS = [
  {
    title: "Boutique",
    links: [
      { label: "Accueil", href: "/" },
      { label: "Tous les produits", href: "/search" },
      { label: "Offres", href: "/offer" },
    ],
  },
  {
    title: "Société",
    links: [
      { label: "À propos", href: "/about-us" },
      { label: "Contact", href: "/contact-us" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Confidentialité", href: "/privacy-policy" },
      { label: "Conditions", href: "/terms-and-conditions" },
    ],
  },
];

const Footer = () => {
  const userInfo = getUserSession();

  const accountLinks = userInfo?.email
    ? [
        { label: "Mon compte", href: "/user/dashboard" },
        { label: "Mes commandes", href: "/user/my-orders" },
        { label: "Mes adresses", href: "/user/add-shipping-address" },
      ]
    : [{ label: "Se connecter", href: "/auth/login" }];

  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-10">
        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-3 lg:grid-cols-6 lg:py-16">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
                <FiShoppingCart className="h-5 w-5" />
              </span>
              <span className="font-serif text-xl font-bold tracking-tight text-gray-800">
                Grossi<span className="text-emerald-500">marché</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500">
              Votre marché de gros en ligne au Maroc — produits en gros, prix dégressifs et
              livraison rapide dans tout le Royaume.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[
                { Icon: FiFacebook, href: "https://facebook.com" },
                { Icon: FiInstagram, href: "https://instagram.com" },
                { Icon: FiTwitter, href: "https://twitter.com" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Réseau social"
                  className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-emerald-500 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-semibold text-gray-800">{col.title}</h3>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-gray-500 transition hover:text-emerald-500"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Account */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-800">Compte</h3>
            <ul className="space-y-2.5 text-sm">
              {accountLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-gray-500 transition hover:text-emerald-500"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact strip */}
        <div className="grid gap-4 border-t border-gray-100 py-6 text-sm text-gray-500 sm:grid-cols-3">
          <a
            href="mailto:contact@grossimarche.ma"
            className="flex items-center gap-2 transition hover:text-emerald-500"
          >
            <FiMail className="h-4 w-4" /> contact@grossimarche.ma
          </a>
          <a
            href="tel:+2125220000000"
            className="flex items-center gap-2 transition hover:text-emerald-500"
          >
            <FiPhone className="h-4 w-4" /> +212 5 22 00 00 00
          </a>
          <span className="flex items-center gap-2 sm:justify-end">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
              Paiement à la livraison
            </span>
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-center px-4 py-5 sm:px-10">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Grossimarché. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default dynamic(() => Promise.resolve(Footer), { ssr: false });
