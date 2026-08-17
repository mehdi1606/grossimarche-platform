import Link from "next/link";
import { FiArrowRight, FiCheck, FiShoppingBag } from "react-icons/fi";

//internal import
import HeroCart from "@components/home/HeroCart";

const PROMISES = [
  "Tarifs dégressifs à la quantité",
  "Paiement à la livraison",
  "Livraison partout au Maroc",
];

const fade = (delay = 0) => ({
  animation: `gmFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
});

/**
 * Home hero: badge, headline, pitch, the three promises that decide a wholesale order, then
 * the calls to action. The second CTA points at the first category, so it needs the list.
 */
const Hero = ({ categories = [] }) => {
  const shortcuts = categories.slice(0, 1);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500">
      <div className="gm-float pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      <div className="gm-float-slow pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-white/5 blur-2xl" />
      <div className="gm-float pointer-events-none absolute right-1/4 top-1/2 h-40 w-40 rounded-full bg-teal-300/10 blur-2xl" />

      <div className="relative mx-auto max-w-screen-2xl px-4 py-16 sm:px-10 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] xl:gap-16">
          {/* Pitch */}
          <div className="max-w-2xl">
            <span
              className="gm-shimmer inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm"
              style={fade()}
            >
              <FiShoppingBag /> Marché de gros en ligne
            </span>

            <h1
              className="mt-5 font-serif text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
              style={fade(0.08)}
            >
              Le gros, livré chez vous.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-emerald-50" style={fade(0.16)}>
              Achetez en gros aux meilleurs prix — produits alimentaires, boissons et
              essentiels, avec des tarifs dégressifs et le paiement à la livraison.
            </p>

            {/* Promises: the three arguments that decide a wholesale order */}
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2" style={fade(0.22)}>
              {PROMISES.map((promise) => (
                <li key={promise} className="flex items-center gap-2 text-sm text-emerald-50">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">
                    <FiCheck className="h-3 w-3" />
                  </span>
                  {promise}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3" style={fade(0.3)}>
              <Link
                href="/search"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Découvrir les produits
                <FiArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
              {shortcuts[0] && (
                <Link
                  href={`/search?category=${shortcuts[0].slug}&_id=${shortcuts[0]._id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Parcourir les catégories
                </Link>
              )}
            </div>
          </div>

          {/* Glass trolley: decorative, so it is hidden from assistive tech and from the
              small screens where it would only push the CTAs below the fold. */}
          <div className="hidden justify-self-center lg:block" style={fade(0.36)}>
            <HeroCart className="h-auto w-full max-w-sm drop-shadow-[0_18px_30px_rgba(0,0,0,0.18)]" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
