import Link from "next/link";
import { ShieldCheck, PhoneCall, Lock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TEAM CCTV | Intelligent Smart Security Configurator",
  description: "Get a professional, AI-tailored CCTV hardware blueprint and quote for your property in minutes. Secure your home or business with India's most advanced security planner.",
  keywords: ["CCTV Quote", "Security System Planner", "TEAM CCTV", "Smart Security", "CCTV Installation India"],
  openGraph: {
    title: "TEAM CCTV | Smart Security, Tailored for You",
    description: "Get your custom security blueprint in 2 minutes.",
    type: "website",
    locale: "en_IN",
    siteName: "TEAM Security Ecosystem",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
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
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-zinc-900 dark:bg-blue-600 text-white p-2.5 rounded-2xl group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-all duration-300 shadow-lg shadow-zinc-900/10 group-hover:shadow-blue-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-2xl tracking-tighter text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                TEAM <span className="text-zinc-400 dark:text-zinc-500 font-medium tracking-tight">CCTV</span>
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500 mt-1">Smart Security Ecosystem</span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <a 
              href="tel:+919876543210" 
              className="hidden md:flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group shadow-sm"
            >
              <PhoneCall className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 transition-colors" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-1">Support</span>
                <span className="text-sm font-black">+91 98765 43210</span>
              </div>
            </a>
            
            <div className="flex items-center gap-4 pl-4 border-l border-zinc-100 dark:border-zinc-800">
              <ThemeToggle />
              <Link 
                href="/admin/login" 
                className="text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-blue-500 transition-colors hidden sm:block"
              >
                Staff Portal
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-0">
        {children}
      </main>

      {/* Premium Elite Footer */}
      <footer className="border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/50 py-16 pb-32 px-6 transition-colors">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="text-left space-y-4">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-black tracking-tighter text-xl">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              TEAM SECURITY
            </div>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium max-w-sm leading-relaxed">
              India&apos;s leading intelligent security planning ecosystem. We combine advanced hardware logic with certified human expertise.
            </p>
          </div>
          
          <div className="flex flex-col md:items-end gap-6">
             <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">ISO 27001 Certified Planner</span>
             </div>
             <div className="flex gap-8">
                <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white">Privacy Policy</Link>
                <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white">Terms of Service</Link>
                <Link href="/admin/login" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white">Partner Login</Link>
             </div>
             <p className="text-[10px] font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.2em] mt-4">
              © {new Date().getFullYear()} TEAM SECURE SYSTEMS PVT LTD.
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
