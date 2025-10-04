import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set turbopack root to current directory to fix warning
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
