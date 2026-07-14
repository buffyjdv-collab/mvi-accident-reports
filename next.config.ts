import type { NextConfig } from "next";

// Build-time version stamp — evaluated once when next.config.ts is loaded during `next build`.
// This lets users verify they are seeing the latest deployment by checking the timestamp.
const BUILD_TIME = new Date().toISOString();
const GIT_SHA = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Expose build version info to client-side code for deployment verification
  env: {
    NEXT_PUBLIC_BUILD_TIME: BUILD_TIME,
    NEXT_PUBLIC_GIT_SHA: GIT_SHA,
  },
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
