import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import defaultRuntimeCaching from "next-pwa/cache";

const sensitiveRuntimeCaching = [
  {
    // Uploaded proof/photo files must never be served from a stale service-worker cache.
    urlPattern: /^https?.*\/uploads\/.*$/i,
    handler: "NetworkOnly",
    method: "GET",
    options: {},
  },
  {
    urlPattern: /^https?.*\/api\/(?:feed\/posts\/[^/]+\/image|public-news\/[^/]+\/image|official\/photo|admission-proofs)(?:\?.*)?$/i,
    handler: "NetworkOnly",
    method: "GET",
    options: {},
  },
];

const sensitiveBuildExcludes = [
  ({ asset }: { asset: { name: string } }) => {
    const assetName = asset.name.replaceAll("\\", "/");
    return [
      "static/chunks/app/api/admission-proofs/route-",
      "static/chunks/app/api/official/photo/route-",
      "static/chunks/app/api/feed/posts/[id]/image/route-",
      "static/chunks/app/api/public-news/[id]/image/route-",
    ].some((path) => assetName.includes(path));
  },
];

const cacheableStaticAssets = new Set([
  "google-fonts-webfonts",
  "google-fonts-stylesheets",
  "static-font-assets",
  "static-image-assets",
  "static-audio-assets",
  "static-video-assets",
  "static-js-assets",
  "static-style-assets",
]);

const safeStaticRuntimeCaching = (defaultRuntimeCaching as { options?: { cacheName?: string } }[])
  .filter((rule) => Boolean(rule.options?.cacheName && cacheableStaticAssets.has(rule.options.cacheName)));

const runtimeCaching = [
  ...sensitiveRuntimeCaching,
  {
    // Never store rendered pages or App Router/RSC navigation responses.
    urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
    handler: "NetworkOnly",
    method: "GET",
    options: {},
  },
  {
    // Never cache API routes; always hit network for auth/attendance correctness.
    urlPattern: /^https?.*\/api\/.*$/i,
    handler: "NetworkOnly",
    method: "GET",
    options: {},
  },
  ...safeStaticRuntimeCaching,
];

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  cacheStartUrl: false,
  dynamicStartUrl: false,
  fallbacks: { document: "/offline" },
  disable: process.env.NODE_ENV !== "production",
  runtimeCaching,
  publicExcludes: ["!noprecache/**/*", "!uploads/**/*"],
  buildExcludes: [...sensitiveBuildExcludes, /middleware-manifest\.json$/],
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    localPatterns: [
      { pathname: "**", search: "" },
      { pathname: "/api/official/photo" },
    ],
  },
  // Keep an explicit turbopack section to avoid Next 16 mismatch warnings
  // when a webpack-oriented plugin (next-pwa) is present.
  turbopack: {},
};

export default withPWA(nextConfig);
