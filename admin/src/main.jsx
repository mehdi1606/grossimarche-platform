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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
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
