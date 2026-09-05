import "@styles/custom.css";
import Head from "next/head";
import { CartProvider } from "react-use-cart";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import { Provider } from "react-redux";
import ReactGA from "react-ga4";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TawkMessengerReact from "@tawk.to/tawk-messenger-react";

// Internal imports
import store from "@redux/store";
import { handlePageView } from "@lib/analytics";
import { UserProvider } from "@context/UserContext";
import DefaultSeo from "@components/common/DefaultSeo";
import AutoTranslate from "@components/common/AutoTranslate";
import { SidebarProvider } from "@context/SidebarContext";
import { TranslationProvider } from "@context/TranslationContext";
import I18nProvider from "@context/I18nProvider";
import SettingServices from "@services/SettingServices";

let persistor = persistStore(store);

/**
 * Data that refreshes itself when the shopper comes back to it.
 *
 * `refetchOnWindowFocus` was off, so a tab left open kept showing yesterday's catalogue -
 * prices, stock and offers frozen until a manual reload. For a wholesale shop that is worse
 * than slow: it is a shopper filling a basket at a price that has since moved.
 *
 * The short `staleTime` stops ordinary browsing from re-fetching on every focus change.
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

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [storeSetting, setStoreSetting] = useState(null);

  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const settings = await queryClient.fetchQuery({
          queryKey: ["storeSetting"],
          queryFn: async () => await SettingServices.getStoreSetting(),
          staleTime: 4 * 60 * 1000, // Cache data for 4 minutes
        });

        setStoreSetting(settings);

        // Initialize Google Analytics
        if (settings?.google_analytic_status) {
          ReactGA.initialize(settings?.google_analytic_key || "");
          handlePageView();

          const handleRouteChange = (url) => {
            handlePageView(`/${router.pathname}`, "Kachabazar");
          };

          router.events.on("routeChangeComplete", handleRouteChange);
          return () => {
            router.events.off("routeChangeComplete", handleRouteChange);
          };
        }
      } catch (error) {
        console.error("Failed to fetch store settings:", error);
      }
    };

    fetchStoreSettings();
  }, [router]);

  return (
    <>
      {/*
        The viewport, declared where Next actually keeps it.

        next-seo was already asking for `viewport-fit=cover`, but the shipped HTML carried only
        Next's default `width=device-width` - checked against the served page, not assumed. The
        difference matters on an iPhone: without `viewport-fit=cover`, every
        `env(safe-area-inset-*)` resolves to zero, so the fixed bottom bar and the category
        drawer, both of which already pad for the home indicator, were padding by nothing and
        sitting underneath it.

        `maximum-scale` is deliberately absent: capping zoom stops a partially sighted shopper
        from enlarging the page, and it is not needed to prevent the focus-zoom - the 16px input
        rule in custom.css handles that without taking the ability away.
      */}
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>

      {/* Render TawkMessengerReact only if tawk_chat_status is enabled */}
      {storeSetting?.tawk_chat_status && (
        <TawkMessengerReact
          propertyId={storeSetting?.tawk_chat_property_id || ""}
          widgetId={storeSetting?.tawk_chat_widget_id || ""}
        />
      )}
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <UserProvider>
            <Provider store={store}>
              <PersistGate loading={null} persistor={persistor}>
                <SidebarProvider>
                  <CartProvider>
                    <TranslationProvider>
                      <I18nProvider>
                        {/* Interface text now comes from the hand-written catalogues in
                            src/locales. AutoTranslate still covers the screens not yet
                            converted; each one that moves to t() is wrapped in
                            [data-no-translate] so the two never touch the same words. It goes
                            away once the last screen is converted. */}
                        <AutoTranslate />
                        <DefaultSeo />
                        <Component {...pageProps} />
                      </I18nProvider>
                    </TranslationProvider>
                  </CartProvider>
                </SidebarProvider>
              </PersistGate>
            </Provider>
          </UserProvider>
        </SessionProvider>
      </QueryClientProvider>
    </>
  );
}

export default MyApp;
