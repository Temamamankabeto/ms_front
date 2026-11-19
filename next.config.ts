
import type { NextConfig } from "next";

/**
 * MESOB eService - Next.js Configuration
 *
 * Development:
 *   Next.js: http://localhost:3000
 *   Laravel: http://127.0.0.1:8000
 *
 * Production:
 *   Next.js: https://mesob.adamacity.gov.et
 *   Laravel: https://mesobbackend.adamacity.gov.et
 *
 * BACKEND_API_URL can override the backend API endpoint.
 */

const isProduction = process.env.NODE_ENV === "production";

const defaultBackendApiUrl = isProduction
  ? "https://mesobbackend.adamacity.gov.et/api"
  : "http://127.0.0.1:8000/api";

const backendApiUrl = (
  process.env.BACKEND_API_URL?.trim() || defaultBackendApiUrl
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "mesob.adamacity.gov.et",
  ],

  async rewrites() {
    return [
      {
        source: "/storage/:path*",
        destination: `${backendApiUrl.replace(/\/api$/, "")}/storage/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
