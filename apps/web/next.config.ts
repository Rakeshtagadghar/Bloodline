import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bloodline/core", "@bloodline/renderer"],
  typedRoutes: false
};

export default nextConfig;
