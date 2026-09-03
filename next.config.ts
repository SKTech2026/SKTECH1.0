import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import defaultRuntimeCaching from "next-pwa/cache";

const runtimeCaching = [
  {
    // Never cache API routes; always hit network for auth/attendance correctness.
    urlPattern: /^https?.*\/api\/.*$/i,
    handler: "NetworkOnly",
    method: "GET",
  },
  ...(defaultRuntimeCaching as object[]),
];

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV !== "production",
  runtimeCaching,
  buildExcludes: [/middleware-manifest\.json$/],
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
