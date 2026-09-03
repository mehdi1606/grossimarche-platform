import Link from "next/link";
import { FiArrowRight, FiArrowUpRight, FiPackage } from "react-icons/fi";

//internal import
import useBundles from "@hooks/useBundles";
import useUtilsFunction from "@hooks/useUtilsFunction";

/** Seconds each tile spends crossing the row. Higher = slower, calmer. */
const SECONDS_PER_TILE = 7;

/**
 * Below this, the row scrolls nothing - it just repeats itself.
 *
 * A marquee needs its content duplicated to loop seamlessly, so with one offer the row becomes
 * the same tile six times, which reads as padding rather than as a catalogue. Fewer offers than
 * this get a layout built for their number instead: one becomes a banner, a handful become a
 * grid. The motion is a consequence of having enough to show, never the reason for the section.
 */
const MARQUEE_MIN = 5;

/** One offer, as a poster. Image and name only - the detail lives on the offers page. */
const OfferTile = ({ bundle, currency, ariaHidden }) => (
  <Link
    href="/offer"
    aria-hidden={ariaHidden || undefined}
    tabIndex={ariaHidden ? -1 : undefined}
    className="group relative block aspect-[4/5] w-[260px] shrink-0 overflow-hidden rounded-2xl bg-emerald-900 sm:w-[300px]"
  >
    {bundle.imageUrl ? (
      <img
        src={bundle.imageUrl}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-105"
      />
    ) : (
      <span className="absolute inset-0 grid place-items-center text-emerald-100/15">
        <FiPackage className="h-24 w-24" aria-hidden="true" />
      </span>
    )}

    <span className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/25 to-transparent" />

    {Number(bundle.savings) > 0 && (
      <span
        data-no-translate
        className="absolute end-3 top-3 rounded-full bg-brass-400 px-2.5 py-1 text-2xs font-bold text-emerald-900 shadow-sm"
      >
        −{bundle.savingsPercent}%
      </span>
    )}

    <span className="absolute inset-x-0 bottom-0 p-5">
      <span className="block font-display text-xl font-semibold leading-snug text-white">
        {bundle.name}
      </span>
      <span className="mt-1.5 flex items-baseline gap-2">
        <span data-no-translate className="font-display text-lg font-semibold text-brass-200">
          {currency}
          {Number(bundle.price).toFixed(2)}
        </span>
        <span data-no-translate className="text-xs text-white/50 line-through">
          {currency}
          {Number(bundle.componentsTotal).toFixed(2)}
        </span>
      </span>
    </span>
  </Link>
);

/**
 * A single offer, given the whole width.
 *
 * When there is exactly one promotion, repeating it across a row does not make the shop look
 * busier - it makes it look like it is pretending. One offer is a statement, so it gets the
 * space of one: a wide banner where the name can be set large and the saving read from across
 * the room.
 */
const OfferFeature = ({ bundle, currency }) => (
  <Link
    href="/offer"
    className="group relative block overflow-hidden rounded-3xl bg-emerald-900"
  >
    <div className="grid md:grid-cols-2">
      {/* Image half */}
      <div className="relative order-2 h-56 md:order-1 md:h-auto md:min-h-[340px]">
        {bundle.imageUrl ? (
          <img
            src={bundle.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-emerald-100/10">
            <FiPackage className="h-40 w-40" aria-hidden="true" />
          </span>
        )}
        {/* Feather the seam between photograph and panel rather than butting them together. */}
        <span className="absolute inset-0 bg-gradient-to-t from-emerald-900 via-emerald-900/30 to-transparent md:bg-gradient-to-r md:from-transparent md:via-emerald-900/40 md:to-emerald-900" />
      </div>

      {/* Copy half */}
      <div className="relative order-1 flex flex-col justify-center p-8 md:order-2 md:p-12">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-2xs font-semibold uppercase tracking-luxe text-emerald-50 ring-1 ring-inset ring-white/20">
          <FiPackage className="h-3 w-3" />
          Panier du moment
        </span>

        <h3 className="mt-5 font-display text-3xl font-semibold leading-tight text-white lg:text-4xl">
          {bundle.name}
        </h3>

        {bundle.description && (
          <p className="mt-3 max-w-md text-sm leading-7 text-emerald-100/70">
            {bundle.description}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            data-no-translate
            className="font-display text-3xl font-semibold text-brass-200"
          >
            {currency}
            {Number(bundle.price).toFixed(2)}
          </span>
          <span data-no-translate className="text-sm text-white/50 line-through">
            {currency}
            {Number(bundle.componentsTotal).toFixed(2)}
          </span>
          {Number(bundle.savings) > 0 && (
            <span
              data-no-translate
              className="rounded-full bg-brass-400 px-2.5 py-1 text-2xs font-bold text-emerald-900"
            >
              −{bundle.savingsPercent}%
            </span>
          )}
        </div>

        <span className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-semibold text-emerald-800 transition group-hover:gap-3">
          Voir l&apos;offre
          <FiArrowUpRight className="gm-dir-icon h-4 w-4" />
        </span>
      </div>
    </div>
  </Link>
);

/**
 * Offers on the home page.
 *
 * The layout is chosen by how many offers are actually running, because one promotion and ten
 * promotions are different things to present:
 *
 *   0        nothing at all - no heading, no empty row, no gap in the page
 *   1        a full-width banner
 *   2 – 4    a grid, each offer once
 *   5+       a continuous marquee
 *
 * The marquee only appears where it earns its place: it needs the list duplicated to loop
 * without a seam, so below five offers it would be showing the same tile again rather than a
 * new one.
 */
const BundleRail = () => {
  const { bundles, isLoading } = useBundles();
  const { currency } = useUtilsFunction();

  if (isLoading || bundles.length === 0) return null;

  const marquee = bundles.length >= MARQUEE_MIN;

  return (
    <section className="overflow-hidden bg-cream py-16 lg:py-20">
      <div className="mx-auto mb-10 flex max-w-screen-2xl items-end justify-between gap-6 px-4 sm:px-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brass-50 px-3 py-1 text-2xs font-semibold uppercase tracking-luxe text-brass-600 ring-1 ring-inset ring-brass-200">
            <FiPackage className="h-3 w-3" />
            {bundles.length > 1 ? "Paniers du moment" : "Offre du moment"}
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-900">
            {bundles.length > 1 ? "Nos offres" : "Notre offre"}
          </h2>
        </div>

        {bundles.length > 1 && (
          <Link
            href="/offer"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-emerald-700 transition hover:gap-2.5 hover:underline sm:flex"
          >
            Toutes les offres <FiArrowRight className="gm-dir-icon h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {bundles.length === 1 && (
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-10">
          <OfferFeature bundle={bundles[0]} currency={currency} />
        </div>
      )}

      {bundles.length > 1 && !marquee && (
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-10">
          {/* `w-fit` + `justify-center`: two or three tiles centre as a group instead of
              hugging the left edge of a very wide screen. */}
          <div className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-5">
            {bundles.map((bundle) => (
              <OfferTile key={bundle.id} bundle={bundle} currency={currency} />
            ))}
          </div>
        </div>
      )}

      {marquee && (
        <div className="gm-marquee gm-marquee-mask">
          <div
            className="gm-marquee-track gap-5"
            style={{ animationDuration: `${bundles.length * SECONDS_PER_TILE}s` }}
          >
            {/* Two identical passes - the minimum a seamless loop needs. The second is hidden
                from assistive tech and taken out of the tab order: it is the same offers
                again, and announcing them twice would be noise. */}
            {bundles.map((bundle) => (
              <OfferTile key={`a-${bundle.id}`} bundle={bundle} currency={currency} />
            ))}
            {bundles.map((bundle) => (
              <OfferTile
                key={`b-${bundle.id}`}
                bundle={bundle}
                currency={currency}
                ariaHidden
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default BundleRail;
