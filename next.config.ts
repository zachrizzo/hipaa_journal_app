import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ['redact-pii']
  },
  webpack: (config) => {
    // Handle CommonJS modules
    config.externals = [...(config.externals || []), 'redact-pii'];
    return config;
  }
};

export default nextConfig;
