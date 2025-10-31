import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Abaikan error linting saat build di Vercel
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
