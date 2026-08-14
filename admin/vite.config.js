import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import compression from "vite-plugin-compression2";
import { visualizer } from "rollup-plugin-visualizer";

import dns from "dns";
import path from "path";

dns.setDefaultResultOrder("verbatim");

export default defineConfig({
  // root: "./", // Set the root directory of your project
  // base: "/", // Set the base URL path for your application

  build: {
    // outDir: "build", // comment this if you select vite as project when deploy
    assetsDir: "@/assets", // Set the directory for the static assets
    // sourcemap: process.env.__DEV__ === "true",
    rollupOptions: {
      // Additional Rollup configuration options if needed
    },
    chunkSizeWarningLimit: 10 * 1024,
  },
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
    compression(),
    // Opening the report launches a browser via the `open` package, which crashes headless
    // builds (in Docker it detects a WSL kernel and spawns a powershell.exe that isn't
    // there). Opt in locally with ANALYZE=true npm run build.
    visualizer({
      filename: "statistics.html",
      open: process.env.ANALYZE === "true",
    }),
  ],

  server: {
    proxy: {
      "/api/": {
        target: "http://localhost:5065",
        changeOrigin: true,
      },
    },
  },
  define: {
    "process.env": process.env,
    // global: {}, //enable this when running on dev/local mode
  },

  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      "@": path.resolve(__dirname, "./src/"),
    },
  },
  test: {
    global: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTest.js"],
  },
});
