import type { NextConfig } from "next";

// Route kiosk requests to the same backend configured for the application.
// NEXT_PUBLIC_BACKEND_URL is already set in the local MESOB environment.
const backendOrigin = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
  "https://mesobbackend.adamacity.gov.et"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["https://mesob.adamacity.gov.et", "http://localhost:3000"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendOrigin}/api/:path*` }];
  },
};

export default nextConfig;
