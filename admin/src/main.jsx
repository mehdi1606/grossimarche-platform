import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { Windmill } from "@windmill/react-ui";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// internal import
import "rc-tree/assets/index.css";
import "react-loading-skeleton/dist/skeleton.css";
import "@/assets/css/custom.css";
import "@/assets/css/tailwind.css";
import App from "@/App";
import myTheme from "@/assets/theme/myTheme";
import { AdminProvider } from "@/context/AdminContext";
import { SidebarProvider } from "@/context/SidebarContext";
import ThemeSuspense from "@/components/theme/ThemeSuspense";
import store from "@/reduxStore/store";
import "@/i18n";

// The PWA service worker was removed: it aggressively cached the app shell and kept serving
// stale bundles after every deploy. Actively unregister any service worker a previous build
// left behind and drop its caches, so returning browsers always load the latest build.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
  if (window.caches?.keys) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

/**
 * Data that refreshes itself when you come back to it.
 *
 * `refetchOnWindowFocus` was off, which is a large part of why the back-office felt frozen: a
 * customer places an order, you switch back to this tab, and the list still shows what it
 * showed ten minutes ago until you press F5. Returning to the tab is the refresh now.
 *
 * A short `staleTime` stops that being wasteful - clicking between two screens inside the same
 * half-minute does not re-fetch - and `refetchOnReconnect` covers the laptop that was asleep.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30 * 1000,
    },
  },
});

let persistor = persistStore(store);

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <AdminProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SidebarProvider>
            <Suspense fallback={<ThemeSuspense />}>
              <Windmill usePreferences theme={myTheme}>
                <App />
              </Windmill>
            </Suspense>
          </SidebarProvider>
        </PersistGate>
      </Provider>
    </AdminProvider>
  </QueryClientProvider>
);
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.register();
