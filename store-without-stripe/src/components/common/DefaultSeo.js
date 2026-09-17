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
        "Market Food - Marché de gros en ligne au Maroc"
      }
      openGraph={{
        type: "website",
        locale: "fr_MA",
        url: globalSetting?.meta_url || "https://grossimarche.ma/",
        images: [
          {
            url: globalSetting?.meta_img || "/brand/og-image.png",
            width: 1200,
            height: 630,
            alt: "Market Food",
          },
        ],
        site_name:
          globalSetting?.meta_title ||
          "Market Food - Marché de gros en ligne au Maroc",
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
          content: "#1A6A45",
        },
      ]}
      additionalLinkTags={[
        {
          rel: "apple-touch-icon",
          href: "/apple-touch-icon.png",
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
