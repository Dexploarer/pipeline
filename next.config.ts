import type { NextConfig } from "next";

// Validate environment variables at build time (skip with SKIP_ENV_VALIDATION=1)
if (!process.env["SKIP_ENV_VALIDATION"]) {
  const { getEnv } = await import("./lib/config/env")
  getEnv()
}

const nextConfig: NextConfig = {
  // Packages that should not be bundled by the server build
  serverExternalPackages: [],

  // The optional `@sentry/nextjs` integration is loaded via a dynamic import
  // with a computed specifier. Webpack flags this as a "Critical dependency";
  // the warning is benign because the module is intentionally optional.
  webpack(config) {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /lib[\\/]monitoring[\\/]sentry/ },
    ];
    return config;
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
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
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            // More secure CSP without 'unsafe-eval' and 'unsafe-inline' in script-src
            // Note: 'unsafe-inline' is kept for style-src as Tailwind CSS requires it
            // TODO: Implement nonce-based CSP for even better security
            value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://openrouter.ai https://*.vercel.app https://*.upstash.io https://api.elevenlabs.io https://*.stackframe.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
