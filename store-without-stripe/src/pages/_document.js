import SettingServices from "@services/SettingServices";
import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);

    // Fetch general metadata from backend API
    const setting = await SettingServices.getStoreSeoSetting();

    // Carry the routed locale into the markup so the first paint is already announced in the
    // right language and direction - TranslationContext only corrects it after hydration.
    return { ...initialProps, setting, locale: ctx?.locale || "fr" };
  }

  render() {
    const setting = this.props.setting;
    const locale = this.props.locale || "fr";
    const dir = ["ar", "he", "fa", "ur"].includes(locale) ? "rtl" : "ltr";
    return (
      <Html lang={locale} dir={dir}>
        <Head>
          <link rel="icon" href={setting?.favicon || "/favicon.png"} />
          {/* Typography: Inter for the interface, Fraunces for editorial headings
              (`font-display`). Preconnect first so the faces are not render-blocking. */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap"
          />
          <meta
            property="og:title"
            content={
              setting?.meta_title ||
              "Grossimarché - Marché de gros en ligne au Maroc"
            }
          />
          <meta property="og:type" content="eCommerce Website" />
          <meta
            property="og:description"
            content={
              setting?.meta_description ||
              "Achetez au prix de gros : tarifs dégressifs, livraison rapide et paiement à la livraison."
            }
          />
          <meta
            name="keywords"
            content={
              setting?.meta_keywords ||
              "marché de gros, grossiste Maroc, achat en gros, Casablanca, Mohammedia"
            }
          />
          <meta
            property="og:url"
            content={
              setting?.meta_url || "https://grossimarche.ma/"
            }
          />
          <meta
            property="og:image"
            content={
              setting?.meta_img ||
              "https://res.cloudinary.com/ahossain/image/upload/v1636729752/facebook-page_j7alju.png"
            }
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
