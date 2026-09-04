import { useEffect } from "react";

/**
 * Re-run a page's loader when the operator comes back to the tab.
 *
 * Most back-office screens fetch once on mount and then hold whatever they got. That is fine
 * while you are working inside one screen - every action already calls the loader itself - but
 * it is exactly wrong for the way the back-office is actually used: two tabs open, orders
 * arriving from the shop, a colleague changing a price. You come back to the tab and the list
 * is telling you about ten minutes ago, so you press F5.
 *
 * Coming back to the tab is now the refresh. Two events rather than one: `visibilitychange`
 * covers switching tabs, `focus` covers switching windows or returning from another app, and
 * a browser fires only one of them depending on which happened.
 *
 * A guard keeps this from being a load generator: nothing is fetched if the last refresh was
 * less than `minIntervalMs` ago, so alt-tabbing quickly does not hammer the API.
 */
const useAutoRefresh = (load, { minIntervalMs = 15000, enabled = true } = {}) => {
  useEffect(() => {
    if (!enabled || typeof load !== "function") return undefined;

    let last = Date.now();
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      if (Date.now() - last < minIntervalMs) return;
      last = Date.now();
      load();
    };

    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [load, minIntervalMs, enabled]);
};

export default useAutoRefresh;
