import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const BACKEND_URL = process.env["BACKEND_URL"] ?? "http://localhost:8080";
if (process.env.NODE_ENV === "production" && !process.env["BACKEND_URL"]) {
  throw new Error("BACKEND_URL must be set in production for apps/web");
}

const nextConfig: NextConfig = {
  /** Dolby Millicast SDK ships ESM that is safer to transpile for the Next client bundle. */
  transpilePackages: ["@millicast/sdk"],
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      /** OpenTelemetry + `require-in-the-middle` use dynamic requires; Sentry pulls them in on the server graph. */
      { module: /@opentelemetry[\\/]instrumentation/ },
      { module: /require-in-the-middle/ },
    ];
    return config;
  },
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
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" },
          { key: "X-XSS-Protection", value: "0" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
