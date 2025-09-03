import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['redact-pii'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'redact-pii'];
    }
    return config;
  },
  eslint: {
    // We run ESLint separately in build:check to handle warnings vs errors properly
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
