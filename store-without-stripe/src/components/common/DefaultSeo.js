import React from "react";
import { DefaultSeo as NextSeo } from "next-seo";

//internal import
import useGetSetting from "@hooks/useGetSetting";

const DefaultSeo = () => {
  const { globalSetting } = useGetSetting();

  return (
    <NextSeo
      title={
        globalSetting?.meta_title ||
        "Grossimarché - Marché de gros en ligne au Maroc"
      }
      openGraph={{
        type: "website",
        locale: "fr_MA",
        url: globalSetting?.meta_url || "https://grossimarche.ma/",
        site_name:
          globalSetting?.meta_title ||
          "Grossimarché - Marché de gros en ligne au Maroc",
      }}
      twitter={{
        handle: "@handle",
        site: "@site",
        cardType: "summary_large_image",
      }}
      additionalMetaTags={[
        // The viewport is declared in _app.js now. Asked for here it never reached the page -
        // the served HTML carried Next's own default instead - and two competing declarations
        // is one more than a browser should have to arbitrate.
        {
          name: "mobile-web-app-capable",
          content: "yes",
        },
        {
          name: "theme-color",
          content: "#ffffff",
        },
      ]}
      additionalLinkTags={[
        {
          rel: "apple-touch-icon",
          href: "/icon-192x192.png",
        },
        {
          rel: "manifest",
          href: "/manifest.json",
        },
      ]}
    />
  );
};

export default DefaultSeo;
