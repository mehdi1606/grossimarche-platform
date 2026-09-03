const runtimeCaching = require("next-pwa/cache");

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  runtimeCaching,
  buildExcludes: [/middleware-manifest\.json$/],
  scope: "/",
  sw: "service-worker.js",
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Locale routing. The locale in the URL is what src/context/I18nProvider reads to pick the
  // message catalogue in src/locales - interface text is written by hand there, not machine
  // translated on display. Catalogue text (product names, descriptions) still goes through
  // LibreTranslate for the screens not yet converted.
  //
  // French and Arabic only. English came from the template and served nobody here; dropping it
  // halves the words to write and check, and one faultless Arabic is worth more to a Moroccan
  // wholesaler than two approximate languages.
  i18n: {
    locales: ["fr", "ar"],
    defaultLocale: "fr",
    // Keep the visitor on the URL they typed; the language menu switches locale explicitly.
    localeDetection: false,
  },

  // images: {
  //   domains: [
  //     "images.unsplash.com",
  //     "img.icons8.com",
  //     "i.ibb.co",
  //     "i.postimg.cc",
  //     "fakestoreapi.com",
  //     "res.cloudinary.com",
  //     "lh3.googleusercontent.com",
  //     "res.cloudinary.com",
  //     "lh3.googleusercontent.com",
  //     "",
  //     "images.dashter.com",
  //   ],
  // },
  images: {
    // Product images are served same-origin by the gateway at /files/**, which the Next
    // image optimizer (running inside the store container) cannot reach. Serving them
    // unoptimized makes the browser load them straight from the gateway. Remote hosts are
    // still allowed for any external imagery.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
});

// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// });

// module.exports = withBundleAnalyzer({});
