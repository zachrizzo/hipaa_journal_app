import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // This tells Next.js to not bundle 'redact-pii' for server components
    serverComponentsExternalPackages: ['redact-pii']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'redact-pii'];
    }
    return config;
  }
};

export default nextConfig;
