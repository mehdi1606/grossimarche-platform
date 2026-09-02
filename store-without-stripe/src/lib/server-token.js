import { getServerSession } from "next-auth/next";

import { getDynamicAuthOptions } from "@lib/next-auth-options";

/**
 * The signed-in customer's API token, from inside `getServerSideProps`.
 *
 * Server-rendered pages fetch the catalogue on the Next server, where the axios default
 * Authorization header set at sign-in does not exist - that lives in the browser. Without this,
 * every SSR page asked the API anonymously, and since prices are resolved per client type, a
 * signed-in shopper was served a catalogue with no prices at all: the products appeared, but
 * every one of them said "Prix sur compte".
 *
 * Returns null when nobody is signed in, which is the correct anonymous view rather than an
 * error - the catalogue is deliberately browsable without an account.
 */
export const serverToken = async (context) => {
  try {
    const session = await getServerSession(
      context.req,
      context.res,
      await getDynamicAuthOptions()
    );
    return session?.user?.token || null;
  } catch {
    // A page that cannot read the session still has to render. It renders as a visitor would
    // see it, which is a degraded page rather than a broken one.
    return null;
  }
};

/** Axios config carrying the caller's token, or nothing when there is none. */
export const authHeader = (token) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
