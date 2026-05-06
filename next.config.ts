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
      // ── Security headers on all routes ───────────────────────────────────
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            // Block microphone/camera; allow geolocation for site map feature
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: GA4 + GTM + Meta Pixel + Sentry CDN
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://js.sentry-cdn.com https://browser.sentry-cdn.com",
              // Styles: Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: Google Fonts CDN
              "font-src 'self' https://fonts.gstatic.com",
              // Images: Firebase Storage + GA tag manager pixel
              "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://www.googletagmanager.com",
              // Connections: Firebase + GA4 + Sentry + Pincode API + Maps
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.google-analytics.com https://www.googletagmanager.com https://o*.ingest.sentry.io https://api.postalpincode.in https://nominatim.openstreetmap.org",
              // Frames: Google Maps embed (SiteDetailsModal)
              "frame-src 'self' https://www.google.com https://maps.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
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
