import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { TrackingProvider } from "@/components/shared/TrackingProvider";
import { JsonLd } from "@/components/shared/JsonLd";
import { WebVitalsReporter } from "@/components/shared/WebVitalsReporter";
import { PwaRegistry } from "@/components/shared/PwaRegistry";
import { Suspense } from "react";
import { headers } from "next/headers";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://cctvquotation.com"),
  manifest: "/manifest.json",
  title: "CCTV Quotation Online | India's Best Security Systems & Installation",
  description: "Get an instant CCTV quotation online anywhere in India. We provide premium cameras like CP Plus & Hikvision with 18% GST included. 100% Free Smart Estimate.",
  keywords: ["CCTV Quotation", "Security Systems India", "CCTV Installation", "Best CCTV Camera", "CP Plus", "Hikvision", "Smart Home Security"],
  openGraph: {
    title: "CCTV Quotation Online | India's Best Security Systems & Installation",
    description: "Instant AI-driven professional CCTV blueprints and exact installation cost for property owners across India.",
    url: "https://cctvquotation.com",
    siteName: "CCTVQuotation",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://cctvquotation.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "CCTVQuotation - Free Instant CCTV Quotation Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CCTV Quotation Online | India's Best Security Systems & Installation",
    description: "Instant professional CCTV blueprints and installation cost for property owners across India.",
    images: ["https://cctvquotation.com/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "google376a26c23c5e2638",
  },
};

/**
 * Next.js 15+ — themeColor must live in the viewport export, not metadata.
 * This eliminates the "Unsupported metadata themeColor" build warning on every route.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#09090b" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || undefined;

  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        {/* ── DNS Preconnect: Firebase Auth + Firestore (used at wizard start) ── */}
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
        {/* ── DNS Preconnect: Analytics ──────────────────────────────────────── */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
      </head>
      <body className={`${inter.className} antialiased selection:bg-blue-500/30`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="team-cctv-theme"
        >
          <Suspense fallback={null}>
            <TrackingProvider nonce={nonce} />
          </Suspense>
          <PwaRegistry />
          <WebVitalsReporter />
          <JsonLd />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
