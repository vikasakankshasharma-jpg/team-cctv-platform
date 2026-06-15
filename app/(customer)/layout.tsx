import Link from "next/link";
import { ShieldCheck, PhoneCall, Zap, ArrowRight, ChevronDown } from "lucide-react";
import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { WhatsAppFloat } from "@/components/shared/WhatsAppFloat";
import { GetQuotationButton } from "@/components/shared/GetQuotationButton";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale removed — was blocking iOS zoom accessibility
};

export const metadata: Metadata = {
  title: "CCTV Quotation Online | Professional Installation & Setup | CCTVQuotation",
  description: "Get a professional, tailored CCTV hardware blueprint and quote for your property in minutes. Transparent pricing with top brands.",
  keywords: ["CCTV Quotation Online", "CCTV Installation", "CCTV Camera Price", "CCTVQuotation"],
  openGraph: {
    title: "CCTV Quotation Online | Professional Installation & Setup | CCTVQuotation",
    description: "Get your custom security blueprint and CCTV installation cost in 2 minutes.",
    type: "website",
    locale: "en_IN",
    siteName: "CCTVQuotation",
  },
};

import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { MobileStickyCtaBar } from "@/components/shared/MobileStickyCtaBar";
import { ServiceAreaModal } from "@/components/shared/ServiceAreaModal";
import { TranslatedText } from "@/components/shared/TranslatedText";
import { LanguageWelcomeModal } from "@/components/shared/LanguageWelcomeModal";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 font-sans transition-colors duration-500 selection:bg-blue-600 selection:text-white">
      {/* Premium Public Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-100/50 dark:border-zinc-800/50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 md:h-20 flex items-center justify-between relative">

          {/* Left — Logo & Cities Dropdown */}
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <div className="bg-zinc-900 dark:bg-blue-600 text-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-all duration-300 shadow-lg shadow-zinc-900/10 group-hover:shadow-blue-500/30">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-lg sm:text-2xl tracking-tighter text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  CCTV<span className="text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">Quotation</span>
                </span>
                <span className="hidden sm:block text-xs sm:text-sm sm:text-xs font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 mt-1">by TEAM</span>
              </div>
            </Link>

            {/* Smart Hierarchical Service Area Modal */}
            <div className="py-2">
              <ServiceAreaModal />
            </div>
          </div>

          {/* Centre — Get Quotation CTA */}
          <div className="hidden lg:flex flex-1 justify-center">
            <GetQuotationButton />
          </div>

          {/* Right — Support + Portal */}
          <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6 shrink-0">
            {/* Phone icon visible on mobile, full button on desktop */}
            <a
              href="tel:+919772699395"
              aria-label="Call support"
              className="flex md:hidden items-center justify-center w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation"
            >
              <PhoneCall className="w-4 h-4" />
            </a>
            <a
              href="tel:+919772699395"
              className="hidden md:flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group shadow-sm"
            >
              <PhoneCall className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 transition-colors" />
              <div className="flex flex-col text-left">
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-500 leading-none mb-1"><TranslatedText tKey="support" defaultText="Support" /></span>
                <span className="text-sm font-black">+91 97726 99395</span>
              </div>
            </a>
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              href="/admin/login"
              className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-500 hover:text-blue-500 transition-colors hidden sm:block"
            >
              <TranslatedText tKey="staff_portal" defaultText="Staff Portal" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-0">
        {children}
      </main>

      <SiteFooter />

      {/* Sticky mobile CTA bar — hidden on wizard pages (handled inside component) */}
      <MobileStickyCtaBar />

      {/* WhatsApp floating button — auto-hides on wizard/admin pages */}
      <WhatsAppFloat />

      {/* Welcome Language Modal */}
      <LanguageWelcomeModal />
    </div>
  );
}
