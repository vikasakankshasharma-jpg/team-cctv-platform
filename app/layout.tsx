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
import { Toaster } from "sonner";
import { LanguageSync } from "@/components/shared/LanguageSync";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://cctvquotation.com"),
  manifest: "/manifest.json",
  title: "Instant Free CCTV Quotation & CCTV on EMI | Lowest Price Guaranteed",
  description: "Get an instant free CCTV quotation online. We offer CCTV on EMI with the lowest price guaranteed for premium cameras like CP Plus & Hikvision.",
  keywords: ["Instant free CCTV quotation", "CCTV on EMI", "Lowest Price Guaranteed CCTV", "CCTV Quotation", "Security Systems India", "CCTV Installation"],
  openGraph: {
    title: "Instant Free CCTV Quotation & CCTV on EMI | Lowest Price Guaranteed",
    description: "Get your instant free CCTV quotation online. CCTV on EMI with the lowest price guaranteed for property owners across India.",
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
    title: "Instant Free CCTV Quotation & CCTV on EMI | Lowest Price Guaranteed",
    description: "Get your instant free CCTV quotation online. CCTV on EMI with the lowest price guaranteed.",
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
            <LanguageSync />
          </Suspense>
          <PwaRegistry />
          <WebVitalsReporter />
          <JsonLd />
          <Toaster position="top-center" richColors closeButton />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
