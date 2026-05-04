import Link from "next/link";
import { ShieldCheck, PhoneCall, Zap } from "lucide-react";
import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/shared/SiteFooter";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "CCTV Quotation Online | Best Installation in Jaipur | TEAM CCTV",
  description: "Looking for CCTV installation in Jaipur? Get a professional, tailored CCTV hardware blueprint and quote for your property in minutes. Transparent pricing with top brands.",
  keywords: ["CCTV Quotation Online", "CCTV Quote Jaipur", "CCTV Installation Jaipur", "CCTV Camera Price Jaipur", "TEAM CCTV"],
  openGraph: {
    title: "CCTV Quotation Online | Best Installation in Jaipur | TEAM CCTV",
    description: "Get your custom security blueprint and CCTV installation cost for Jaipur in 2 minutes.",
    type: "website",
    locale: "en_IN",
    siteName: "TEAM Security Ecosystem",
  },
};

import { ThemeToggle } from "@/components/shared/ThemeToggle";

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
          
          {/* Left — Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="bg-zinc-900 dark:bg-blue-600 text-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-all duration-300 shadow-lg shadow-zinc-900/10 group-hover:shadow-blue-500/30">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-lg sm:text-2xl tracking-tighter text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                TEAM <span className="text-zinc-400 dark:text-zinc-500 font-medium tracking-tight">CCTV</span>
              </span>
              <span className="hidden sm:block text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500 mt-1">Smart Security Ecosystem</span>
            </div>
          </Link>

          {/* Centre — Get Quotation CTA */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link
              href="/wizard"
              className="group flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-95"
            >
              <Zap className="w-3 h-3 group-hover:animate-pulse" />
              <span className="hidden sm:inline">Get Quotation</span>
              <span className="sm:hidden">Quote</span>
            </Link>
          </div>

          {/* Right — Support + Portal */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
            <a 
              href="tel:+919772699395" 
              className="hidden md:flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group shadow-sm"
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
    </div>
  );
}
