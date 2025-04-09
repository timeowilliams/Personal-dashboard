import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Ignores all TS errors
  },
  eslint: {
    ignoreDuringBuilds: true, // Keeps linting off, matching --no-lint
  },
  
};

export default nextConfig;
