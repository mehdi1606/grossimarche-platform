import axios from "axios";
import Cookies from "js-cookie";

import { cookieOptions } from "@/utils/cookieOptions";

const BASE_URL = `${import.meta.env.VITE_APP_API_BASE_URL}`;

/**
 * How long the browser keeps the signed-in staff member.
 *
 * Matched to the refresh token's own life (30 days). It used to be half a day, which meant the
 * back-office signed you out overnight even though the server was still perfectly willing to
 * renew the session.
 */
const SESSION_DAYS = 30;

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 50000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const readAdmin = () => {
  try {
    const raw = Cookies.get("adminInfo");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeAdmin = (info) =>
  Cookies.set("adminInfo", JSON.stringify(info), cookieOptions({ expires: SESSION_DAYS }));

// Add a request interceptor
instance.interceptors.request.use(function (config) {
  const adminInfo = readAdmin();
  const company = Cookies.get("company") || null;

  const headers = {
    ...config.headers,
    authorization: adminInfo ? `Bearer ${adminInfo.token}` : null,
    company,
  };

  /*
   * A file upload must not be labelled as JSON.
   *
   * The instance sets `Content-Type: application/json` for every request, which is right for
   * the twenty JSON endpoints and wrong for the three multipart ones. Axios only fills in
   * `multipart/form-data; boundary=...` when the header is absent - so a FormData body went out
   * announced as JSON and with no boundary, and Spring answered "Current request is not a
   * multipart request": an unhandled exception, hence a bare 500 on every product or offer
   * image and on the CSV import.
   *
   * Deleting the header here rather than at each call site means a new upload cannot forget it.
   */
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  return { ...config, headers };
});

/**
 * The refresh currently in flight, if any.
 *
 * Refresh tokens are single-use and rotate: presenting one that has already been rotated is
 * treated by the API as theft and revokes every session in the family. A dashboard fires half a
 * dozen requests at once, so without this every one of them would refresh in parallel, five
 * would present a spent token, and the staff member would be signed out hard - by the very
 * mechanism meant to keep them signed in.
 */
let refreshing = null;

const refreshAccessToken = async () => {
  const info = readAdmin();
  if (!info?.refreshToken) {
    throw new Error("no refresh token");
  }
  // A bare axios call on purpose: going through `instance` would run these interceptors again
  // and a failing refresh would try to refresh itself.
  const res = await axios.post(
    `${BASE_URL}/auth/refresh`,
    { refreshToken: info.refreshToken },
    { headers: { Accept: "application/json", "Content-Type": "application/json" } }
  );
  const next = {
    ...info,
    token: res.data.accessToken,
    // Rotated: the old one is spent, and keeping it would sign us out on the next renewal.
    refreshToken: res.data.refreshToken,
  };
  writeAdmin(next);
  return next.token;
};

const signOut = () => {
  Cookies.remove("adminInfo");
  // Full reload rather than a router push: whatever is on screen was built for a session that
  // no longer exists, and half of it would keep 401-ing behind the login form.
  window.location.assign(`${import.meta.env.BASE_URL || "/"}`);
};

/**
 * Renew the access token instead of dumping the user on the login screen.
 *
 * The access token lasts fifteen minutes and nothing renewed it, so the back-office threw
 * "Authentification requise ou jeton invalide" a quarter of an hour after signing in - while
 * holding a refresh token good for thirty days.
 */
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || "";

    // Only a 401, only once per request, and never for the auth calls themselves - a failed
    // login is not a stale session.
    if (status !== 401 || original?._retried || url.includes("/auth/")) {
      return Promise.reject(error);
    }
    if (!readAdmin()?.refreshToken) {
      return Promise.reject(error);
    }

    original._retried = true;
    try {
      refreshing = refreshing || refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      original.headers = { ...original.headers, authorization: `Bearer ${token}` };
      return instance(original);
    } catch {
      // The refresh token is spent, revoked or expired: this session is genuinely over.
      signOut();
      return Promise.reject(error);
    }
  }
);

const responseBody = (response) => response.data;

const requests = {
  get: (url, body, headers) =>
    instance.get(url, body, headers).then(responseBody),

  post: (url, body) => instance.post(url, body).then(responseBody),

  put: (url, body, headers) =>
    instance.put(url, body, headers).then(responseBody),

  patch: (url, body) => instance.patch(url, body).then(responseBody),

  delete: (url, body) => instance.delete(url, body).then(responseBody),
};

export default requests;
