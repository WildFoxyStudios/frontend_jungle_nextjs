import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const BACKEND_URL = process.env["BACKEND_URL"] ?? "http://localhost:8080";
const WS_URL     = process.env["WS_URL"]      ?? "ws://localhost:8080";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http",  hostname: "localhost" },
    ],
  },
  experimental: { typedRoutes: false },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
      {
        source: "/ws",
        destination: `${WS_URL}/ws`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Platform", value: "web" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
