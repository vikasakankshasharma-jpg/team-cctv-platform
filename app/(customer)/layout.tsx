import Link from "next/link";
import { ShieldCheck, PhoneCall, Zap, ArrowRight, ChevronDown } from "lucide-react";
import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { WhatsAppFloat } from "@/components/shared/WhatsAppFloat";

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
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <div className="bg-zinc-900 dark:bg-blue-600 text-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-all duration-300 shadow-lg shadow-zinc-900/10 group-hover:shadow-blue-500/30">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-lg sm:text-2xl tracking-tighter text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  CCTV<span className="text-zinc-400 dark:text-zinc-400 font-medium tracking-tight">Quotation</span>
                </span>
                <span className="hidden sm:block text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-400 mt-1">by TEAM</span>
              </div>
            </Link>

            {/* Premium Cities Dropdown */}
            <div className="relative group/dropdown py-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100/50 dark:border-zinc-800/50 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm cursor-pointer">
                <span>Cities</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover/dropdown:rotate-180 transition-transform duration-300" />
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100/80 dark:border-zinc-800/80 shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-300 transform scale-95 group-hover/dropdown:scale-100 origin-top-left z-50 p-2 space-y-1 backdrop-blur-md">
                <Link href="/jaipur" className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
                  <span>Jaipur</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md">Live</span>
                </Link>
                <Link href="/jodhpur" className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
                  <span>Jodhpur</span>
                  <span className="text-[8px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md">Soon</span>
                </Link>
                <Link href="/kota" className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
                  <span>Kota</span>
                  <span className="text-[8px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md">Soon</span>
                </Link>
                <Link href="/ajmer" className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
                  <span>Ajmer</span>
                  <span className="text-[8px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md">Soon</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Centre — Get Quotation CTA */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link
              href="/wizard"
              className="group flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-95 touch-manipulation"
            >
              <Zap className="w-3 h-3 group-hover:animate-pulse" />
              <span className="hidden sm:inline">Get Quotation</span>
              <span className="sm:hidden">Quote</span>
            </Link>
          </div>

          {/* Right — Support + Portal */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
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
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-1">Support</span>
                <span className="text-sm font-black">+91 97726 99395</span>
              </div>
            </a>
            <ThemeToggle />
            <Link
              href="/admin/login"
              className="text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-blue-500 transition-colors hidden sm:block"
            >
              Staff Portal
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
    </div>
  );
}
