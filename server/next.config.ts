import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable service worker registration
  experimental: {
    ppr: false,
  },
  // Ensure service worker is served from public directory
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
