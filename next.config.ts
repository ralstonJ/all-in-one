import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app is fully auth-gated and renders per request, so Cache Components
  // (and the Suspense boundaries it requires around every cookie read) is off.
  cacheComponents: false,
  experimental: {
    // Job-completion photos are resized in the browser, but allow a handful per upload.
    serverActions: { bodySizeLimit: "12mb" },
    proxyClientMaxBodySize: "12mb",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
