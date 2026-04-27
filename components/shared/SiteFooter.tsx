"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";

export function SiteFooter() {
  const pathname = usePathname();
  // Hide footer on wizard pages — the wizard has its own inline nav, 
  // and the footer would overlap it on short steps
  if (pathname?.startsWith("/wizard")) return null;

  return (
    <footer className="border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/50 py-16 px-6 transition-colors">
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
          <div className="flex flex-wrap gap-x-6 gap-y-2 items-center md:justify-end">
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Service Hubs:</span>
             <Link href="/jaipur" className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500 hover:underline">Jaipur</Link>
             <Link href="/jodhpur" className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500 hover:underline">Jodhpur</Link>
             <Link href="/kota" className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500 hover:underline">Kota</Link>
             <Link href="/ajmer" className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500 hover:underline">Ajmer</Link>
          </div>
          <div className="flex gap-8">
            <Link href="/privacy-policy" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white">Terms of Service</Link>
            <Link href="/admin/login" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white">Partner Login</Link>
          </div>
          <p className="text-[10px] font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.2em] mt-4">
            © {new Date().getFullYear()} TEAM SECURE SYSTEMS PVT LTD.
          </p>
        </div>
      </div>
    </footer>
  );
}
