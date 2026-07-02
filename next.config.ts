import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Prisma 6: bundle @prisma/client (don't externalize) — fixes Turbopack hash mismatch
  // Only the "prisma" CLI stays external
  serverExternalPackages: ["prisma"],
};

export default nextConfig;
