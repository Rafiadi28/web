import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  experimental: {
    allowedDevOrigins: [
      'localhost:3000',
      '192.168.192.227:3000'
    ],
  } as any,
};

export default nextConfig;
