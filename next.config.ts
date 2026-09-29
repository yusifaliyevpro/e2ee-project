import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  typedRoutes: true,
  partialPrefetching: true,
  // Keep the dev badge off the projector while rehearsing with `pnpm dev`
  devIndicators: false,
  experimental: {
    useOffline: true,
    useTypeScriptCli: true,
    turbopackRustReactCompiler: true,
  },
  images: {
    qualities: [75, 100],
    minimumCacheTTL: 2592000, // 30 days
  },
};

export default nextConfig;
