import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "motion",
      "framer-motion",
      "@radix-ui/react-tabs",
      "@radix-ui/react-dialog",
      "@clerk/nextjs",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
