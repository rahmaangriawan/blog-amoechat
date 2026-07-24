import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"} https://challenges.cloudflare.com https://www.googletagmanager.com https://static.cloudflareinsights.com`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: ws: wss: https://www.google-analytics.com https://region1.google-analytics.com https://cloudflareinsights.com",
  "frame-src 'self' https: blob:",
  "media-src 'self' https: blob:",
  "worker-src 'self' blob:",
  isProduction ? "upgrade-insecure-requests" : "",
]
  .filter(Boolean)
  .join("; ");

const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'report-sample' https://challenges.cloudflare.com https://www.googletagmanager.com https://static.cloudflareinsights.com",
  "script-src-attr 'none'",
  "style-src 'self' 'report-sample'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com https://www.google-analytics.com https://region1.google-analytics.com https://cloudflareinsights.com",
  "frame-src 'self' https://challenges.cloudflare.com",
  "media-src 'self' https: blob:",
  "worker-src 'self' blob:",
]
  .join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  productionBrowserSourceMaps: false,

  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31_536_000,
    remotePatterns: [
      { protocol: "https", hostname: "blog.amoechat.com" },
    ],
  },

  // Pindah dari experimental ke root (Next.js 15+)
  outputFileTracingExcludes: {
    "*": [
      // SWC binaries — tidak dipakai di runtime
      "node_modules/@swc/core-linux-x64-gnu/**",
      "node_modules/@swc/core-linux-x64-musl/**",
      "node_modules/@swc/core-darwin-x64/**",
      "node_modules/@swc/core-darwin-arm64/**",
      "node_modules/@swc/core-win32-x64-msvc/**",
      // esbuild binaries
      "node_modules/@esbuild/linux-x64/**",
      "node_modules/@esbuild/darwin-x64/**",
      "node_modules/@esbuild/darwin-arm64/**",
      "node_modules/@esbuild/win32-x64/**",
      // Prisma engines platform yang TIDAK dipakai di server production (Linux)
      // Server cPanel pakai debian-openssl-1.0.x, jadi JANGAN exclude itu
      "node_modules/.prisma/client/libquery_engine-darwin*",
      "node_modules/.prisma/client/libquery_engine-windows*",
      "node_modules/.prisma/client/query_engine-windows*",
    ],
  },

  // Prisma di-bundle oleh Next.js (webpack mode)
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          ...(isProduction
            ? [{ key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicyReportOnly }]
            : []),
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/packages", destination: "/paket", permanent: true },
      { source: "/packages/:slug", destination: "/paket/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
