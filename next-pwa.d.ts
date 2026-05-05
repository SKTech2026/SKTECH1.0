declare module "next-pwa" {
  import type { NextConfig } from "next";

  type PWAOptions = Record<string, unknown>;
  type PWAEnhancer = (config: NextConfig) => NextConfig;

  export default function withPWAInit(options?: PWAOptions): PWAEnhancer;
}

declare module "next-pwa/cache" {
  const runtimeCaching: Record<string, unknown>[];
  export default runtimeCaching;
}
