import type { NextConfig } from "next";

const backendApiUrl = "https://mesobbackend.adamacity.gov.et/api";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "https://mesob.adamacity.gov.et/",
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
