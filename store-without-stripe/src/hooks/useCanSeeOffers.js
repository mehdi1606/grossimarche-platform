import { useSession } from "next-auth/react";

/**
 * Whether the baskets mean anything to whoever is looking.
 *
 * A basket is priced per trade: what a pastry shop pays for one is not what a grocer pays, and
 * the API withholds every price from a visitor with no segment. So an anonymous visitor - or an
 * account still waiting to be approved, which has no trade assigned yet - would reach the
 * offers page and find a list of baskets with no prices on them. That is worse than not
 * offering the page: it promises a deal and shows nothing.
 *
 * The condition is the segment rather than merely being signed in, because the segment is what
 * the server actually prices against. Being signed in without one buys the same empty page.
 */
const useCanSeeOffers = () => {
  const { data } = useSession();
  return Boolean(data?.user?.clientTypeId);
};

export default useCanSeeOffers;
