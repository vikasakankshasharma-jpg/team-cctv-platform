import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  async headers() {
    return [
      // ── Explicit Cache Bypass for Root & City Routes ─────────────────────
      {
        source: '/:slug(jaipur|jodhpur|kota|ajmer)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      // ── Security headers on all routes ───────────────────────────────────
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },

          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://*.googleapis.com https://www.recaptcha.net https://*.firebaseapp.com blob:; connect-src 'self' https://*.googleapis.com https://*.google.com https://www.google.com https://www.recaptcha.net https://*.firebaseapp.com https://*.firebasestorage.app https://vitals.vercel-insights.com https://*.sentry.io https://api.postalpincode.in https://nominatim.openstreetmap.org; frame-src 'self' https://www.google.com https://www.recaptcha.net https://*.firebaseapp.com; img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://firebasestorage.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; worker-src 'self' blob:;"
          },
          {
            key: 'Permissions-Policy',
            // Block microphone/camera; allow geolocation for site map feature
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
      // ── Long-cache for immutable static assets ────────────────────────────
      {
        source: '/:path*\\.(ico|png|jpg|jpeg|svg|webp|avif|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "team-cctv",
  project: "cctv-platform",
  silent: true,
  widenClientFileUpload: true,
});
