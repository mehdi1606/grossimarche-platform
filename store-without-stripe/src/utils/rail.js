/**
 * Horizontal rails, in both reading directions.
 *
 * `scrollLeft` is a physical measure and does not mirror with the page. In a right-to-left
 * document Chrome reports 0 at the *start* of the rail and counts down into negatives as the
 * reader moves along it, so the naive checks - `scrollLeft <= 4` for the start,
 * `scrollLeft + clientWidth >= scrollWidth` for the end - read as "always at the start, never
 * at the end": the back arrow stays greyed out for the whole row and the forward arrow never
 * greys out at all.
 *
 * These two helpers speak in distance travelled and in "forward/back" rather than left/right,
 * which is what the arrows actually mean. Both directions then use the same code path, so the
 * Arabic rail cannot drift away from the French one.
 */

/** How far the rail has travelled from its start, whichever edge that is. */
export const railOffset = (el) => Math.abs(el.scrollLeft);

/** True when the rail has nothing further to show in that direction (4px for sub-pixel widths). */
export const railAtStart = (el) => railOffset(el) <= 4;
export const railAtEnd = (el) =>
  railOffset(el) + el.clientWidth >= el.scrollWidth - 4;

/**
 * Move the rail one step. `direction` is +1 for forward (further along the reading order) and
 * -1 for back; the physical sign is worked out from the element's own computed direction, so
 * a rail nested in an explicitly-directioned block still behaves.
 */
export const railScrollBy = (el, direction, amount) => {
  const rtl =
    typeof window !== "undefined" &&
    window.getComputedStyle(el).direction === "rtl";
  el.scrollBy({ left: (rtl ? -direction : direction) * amount, behavior: "smooth" });
};
