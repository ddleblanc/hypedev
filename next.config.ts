import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Security headers for production hardening
 */
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Existing patterns
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "www.fiercepc.co.uk",
      },
      {
        protocol: "https",
        hostname: "image.civitai.com",
      },
      // IPFS gateways
      {
        protocol: "https",
        hostname: "**.ipfs.io",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
      },
      // Thirdweb CDN
      {
        protocol: "https",
        hostname: "**.thirdwebcdn.com",
      },
      {
        protocol: "https",
        hostname: "*.thirdwebcdn.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// Conditionally wrap with bundle analyzer
let exportedConfig: NextConfig = nextConfig;

if (process.env.ANALYZE === "true") {
  // Dynamic import for bundle analyzer (dev dependency)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: true,
  });
  exportedConfig = withBundleAnalyzer(nextConfig);
}

export default withSentryConfig(exportedConfig, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Suppress source map upload logs
  silent: true,

  // Upload source maps for production
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a proxy
  tunnelRoute: "/monitoring",

  // Source maps configuration
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
