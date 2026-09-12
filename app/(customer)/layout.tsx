import Link from "next/link";
import Image from "next/image";
import { PhoneCall, User } from "lucide-react";
import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { WhatsAppFloat } from "@/components/shared/WhatsAppFloat";
import { GetQuotationButton } from "@/components/shared/GetQuotationButton";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Instant Free CCTV Quotation & CCTV on EMI | Lowest Price Guaranteed",
  description: "Get an instant free CCTV quotation online. We offer CCTV on EMI with the lowest price guaranteed for CP Plus, Hikvision & Prama. 100% Free Smart Estimate.",
  keywords: ["Instant free CCTV quotation", "CCTV on EMI", "Lowest Price Guaranteed CCTV", "CCTVQuotation", "CCTV Installation"],
  openGraph: {
    title: "Instant Free CCTV Quotation & CCTV on EMI | Lowest Price Guaranteed",
    description: "Get your custom security blueprint and CCTV installation cost instantly with the lowest price guaranteed.",
    type: "website",
    locale: "en_IN",
    siteName: "CCTVQuotation",
  },
};


import { MobileStickyCtaBar } from "@/components/shared/MobileStickyCtaBar";
import { ServiceAreaModal } from "@/components/shared/ServiceAreaModal";
import { TranslatedText } from "@/components/shared/TranslatedText";
import { LanguageWelcomeModal } from "@/components/shared/LanguageWelcomeModal";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { TrackBookingButton } from "@/components/shared/TrackBookingButton";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 font-sans transition-colors duration-500 selection:bg-blue-600 selection:text-white">
      {/* Premium Public Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-100/50 dark:border-zinc-800/50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between">

          {/* Left — Logo & Service Areas */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link href="/" className="flex items-center group shrink-0">
              <Image 
                src="/logo-horizontal.jpg"
                alt="CCTVQuotation by TEAM"
                width={300}
                height={90}
                className="h-8 sm:h-10 w-auto mix-blend-multiply dark:mix-blend-normal dark:bg-white dark:p-1 dark:rounded-lg transition-transform hover:scale-105 origin-left"
                priority
              />
            </Link>

            <div className="hidden md:block">
              <ServiceAreaModal />
            </div>
          </div>

          {/* Centre — Primary CTA (desktop only) */}
          <div className="hidden lg:flex flex-1 justify-center">
            <GetQuotationButton />
          </div>

          {/* Right — Navigation & Support */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Nav Links */}
            <TrackBookingButton />

            <Link
              href="/customer/dashboard"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-all"
              title="My Account"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                <TranslatedText tKey="my_account" defaultText="My Account" />
              </span>
            </Link>

            {/* Divider */}
            <div className="hidden sm:block w-px h-5 bg-zinc-200 dark:bg-zinc-700"></div>

            {/* Support — Icon on mobile, full on desktop */}
            <a
              href="tel:+917357612865"
              aria-label="Call support"
              className="flex md:hidden items-center justify-center w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:text-blue-600 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
            </a>
            <a
              href="tel:+917357612865"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-xs"
            >
              <PhoneCall className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold">+91 73576 12865</span>
            </a>

            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-0">
        {children}
      </main>

      <SiteFooter />

      {/* Sticky mobile CTA bar ?" hidden on wizard pages (handled inside component) */}
      <MobileStickyCtaBar />

      {/* WhatsApp floating button ?" auto-hides on wizard/admin pages */}
      <WhatsAppFloat />

      {/* Welcome Language Modal */}
      <LanguageWelcomeModal />
    </div>
  );
}
