import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Prisma 6: bundle @prisma/client (don't externalize) — fixes Turbopack hash mismatch
  // Only the "prisma" CLI stays external
  serverExternalPackages: ["prisma"],
  // Set conservative cache headers for static assets in /public so that
  // updated files (e.g. logo.png) are re-fetched by browsers instead of
  // serving stale cached copies. HTML pages are never cached.
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)",
        locale: false,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
