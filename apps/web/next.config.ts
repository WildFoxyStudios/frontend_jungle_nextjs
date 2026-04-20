import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const BACKEND_URL = process.env["BACKEND_URL"] ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http",  hostname: "**" },
    ],
  },
  typedRoutes: false,
  async redirects() {
    return [
      {
        source: "/default-avatar.jpg",
        destination: "/default-avatar.svg",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
      {
        source: "/ws",
        destination: `${BACKEND_URL}/ws`,
      },
      {
        source: "/ws/:path*",
        destination: `${BACKEND_URL}/ws/:path*`,
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
