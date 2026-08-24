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
  // Locale *routing* only — there are no message catalogues behind these. Content is
  // authored in French and machine-translated at runtime through the backend's
  // LibreTranslate endpoint (see src/context/TranslationContext.js), so adding a language
  // here is the whole job: no locales/<lang>/common.json to write or keep in sync.
  //
  // These used to be declared twice — once here as ["en","es","fr","de"] with an English
  // default, and again in i18n.json, whose values silently won because next-translate's
  // plugin was spread in last.
  i18n: {
    locales: ["fr", "ar", "en"],
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
