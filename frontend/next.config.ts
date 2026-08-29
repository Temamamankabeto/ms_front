import type { NextConfig } from "next";

const backendApiUrl = "http://127.0.0.1:8000/api";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
