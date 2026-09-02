import Link from "next/link";
import dynamic from "next/dynamic";
import {
  FiFacebook,
  FiInstagram,
  FiTwitter,
  FiMail,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";

//internal import
import { getUserSession } from "@lib/auth";
import BrandMark from "@components/common/BrandMark";

const COLUMNS = [
  {
    title: "Boutique",
    links: [
      { label: "Accueil", href: "/" },
      { label: "Tous les produits", href: "/search" },
      { label: "Paniers & offres", href: "/offer" },
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

const SOCIALS = [
  { Icon: FiFacebook, href: "https://facebook.com", label: "Facebook" },
  { Icon: FiInstagram, href: "https://instagram.com", label: "Instagram" },
  { Icon: FiTwitter, href: "https://twitter.com", label: "Twitter" },
];

/**
 * The footer.
 *
 * Deep green rather than white, on purpose: a cream page that simply stops has no ending, and
 * the eye keeps looking for one. A dark base closes the page, and it is where premium
 * storefronts put their weight - the last thing a visitor sees should feel like the cover of
 * the shop, not leftover space.
 *
 * The previous version left a large void: the brand block spanned two of six columns and the
 * four link lists (one of them a single link) could not fill the rest. Here the contact
 * details sit under the brand - they are what a wholesale buyer actually looks for down here -
 * so both sides of the grid carry real weight.
 */
const Footer = () => {
  const userInfo = getUserSession();

  const accountLinks = userInfo?.email
    ? [
        { label: "Mon compte", href: "/user/dashboard" },
        { label: "Mes commandes", href: "/user/my-orders" },
        { label: "Mes adresses", href: "/user/my-account#adresses" },
      ]
    : [
        { label: "Se connecter", href: "/auth/login" },
        { label: "Suivre ma commande", href: "/auth/login?redirectUrl=orders" },
      ];

  const columns = [...COLUMNS, { title: "Compte", links: accountLinks }];

  return (
    <footer className="relative bg-emerald-900 text-emerald-50">
      {/* A single brass hairline along the top edge - the one bright note, and what stops the
          dark block from reading as a plain slab. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass-400/60 to-transparent"
      />

      <div className="mx-auto max-w-screen-2xl px-4 sm:px-10">
        <div className="grid gap-x-8 gap-y-12 py-16 lg:grid-cols-12 lg:py-20">
          {/* Brand + how to reach us */}
          <div className="lg:col-span-5 xl:col-span-4">
            <BrandMark variant="light" />

            <p className="mt-6 max-w-sm text-sm leading-7 text-emerald-100/70">
              Votre marché de gros en ligne au Maroc - produits en gros, tarifs dégressifs
              et livraison rapide dans tout le Royaume.
            </p>

            <ul className="mt-8 space-y-3.5">
              <li>
                <a
                  href="mailto:contact@grossimarche.ma"
                  data-no-translate
                  className="group flex items-center gap-3 text-sm text-emerald-100/80 transition hover:text-white"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/10 transition group-hover:bg-white/10">
                    <FiMail className="h-4 w-4" />
                  </span>
                  contact@grossimarche.ma
                </a>
              </li>
              <li>
                <a
                  href="tel:+2125220000000"
                  data-no-translate
                  className="group flex items-center gap-3 text-sm text-emerald-100/80 transition hover:text-white"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/10 transition group-hover:bg-white/10">
                    <FiPhone className="h-4 w-4" />
                  </span>
                  +212 5 22 00 00 00
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-emerald-100/60">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/10">
                  <FiMapPin className="h-4 w-4" />
                </span>
                Mohammedia · Casablanca · Benslimane
              </li>
            </ul>
          </div>

          {/* Link columns */}
          <nav className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:col-span-7 xl:col-span-8">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="mb-5 text-2xs font-semibold uppercase tracking-luxe text-brass-300/80">
                  {col.title}
                </h3>
                <ul className="space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-emerald-100/75 underline-offset-4 transition hover:text-white hover:underline"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-5 px-4 py-6 sm:px-10 md:flex-row">
          <p className="order-2 text-xs text-emerald-100/50 md:order-1">
            © {new Date().getFullYear()} Grossimarché. Tous droits réservés.
          </p>

          <div className="order-1 flex items-center gap-5 md:order-2">
            <span className="hidden rounded-full bg-white/5 px-3 py-1.5 text-2xs font-medium uppercase tracking-luxe text-emerald-100/70 ring-1 ring-inset ring-white/10 sm:inline">
              Paiement à la livraison
            </span>
            <div className="flex items-center gap-2.5">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full text-emerald-100/70 ring-1 ring-inset ring-white/15 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default dynamic(() => Promise.resolve(Footer), { ssr: false });
