/**
 * Cookie attributes that survive the scheme the app is actually served over.
 *
 * Every cookie here used to be written with `SameSite=None; Secure`. Both attributes are
 * rejected on a plain-HTTP origin — `Secure` outright, and `SameSite=None` because the spec
 * requires it to be paired with `Secure` — so on `http://<ip>/` the browser silently dropped
 * them. The signed-in state lived in React state for the tab while every subsequent request
 * went out unauthenticated and came back 401.
 *
 * `Lax` is the right default anyway: the storefront and the API are the same origin behind
 * the gateway, so the cookie is never sent cross-site. `None; Secure` is kept for HTTPS, where
 * it is both valid and needed if the API is ever served from another domain.
 */
export const cookieOptions = (extra = {}) => {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";

  return {
    sameSite: secure ? "None" : "Lax",
    ...(secure ? { secure: true } : {}),
    ...extra,
  };
};

export default cookieOptions;
