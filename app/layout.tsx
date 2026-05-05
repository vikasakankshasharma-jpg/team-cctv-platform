import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { TrackingProvider } from "@/components/shared/TrackingProvider";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://cctvquotation.com"),
  title: "CCTV Quotation Online | Free Instant Quote in Jaipur | TEAM CCTV",
  description: "Get an instant CCTV quotation online in Jaipur. We install premium STQC compliant cameras like CP Plus with 18% GST included. 100% Free Smart Estimate.",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#09090b" },
  ],
  openGraph: {
    title: "CCTV Quotation Online | Free Instant Quote in Jaipur | TEAM CCTV",
    description: "Instant AI-driven professional CCTV blueprints and exact installation cost for Jaipur property owners.",
    url: "https://cctvquotation.com",
    siteName: "TEAM CCTV Jaipur",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CCTV Quotation Online | Free Instant Quote in Jaipur | TEAM CCTV",
    description: "Instant professional CCTV blueprints and installation cost for Jaipur property owners.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "google376a26c23c5e2638",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
            <TrackingProvider />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
