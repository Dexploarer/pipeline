import type { NextConfig } from "next";

// Validate environment variables at build time
import "./lib/config/env";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Enable strict mode for better error detection
    strictNextHead: true,
  },

  // API body size limit (10MB default)
  serverExternalPackages: [],

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
            value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://openrouter.ai https://*.vercel.app https://*.upstash.io; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
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
