"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, MessageCircle } from "lucide-react";
import { TranslatedText } from "@/components/shared/TranslatedText";
import { WhatsAppQR } from "@/components/shared/WhatsAppQR";

export function SiteFooter() {
  const pathname = usePathname();
  // Hide footer on wizard pages — the wizard has its own inline nav, 
  // and the footer would overlap it on short steps
  if (pathname?.startsWith("/wizard")) return null;

  return (
    <footer className="border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/50 py-8 md:py-12 sm:py-16 px-4 sm:px-6 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-12 transition-colors">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
        <div className="text-left space-y-5 sm:space-y-6">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo-horizontal.jpg"
              alt="CCTVQuotation by TEAM"
              width={200}
              height={48}
              className="h-9 md:h-11 w-auto mix-blend-multiply dark:mix-blend-normal dark:bg-white dark:p-1.5 dark:rounded-xl transition-all"
            />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium max-w-sm leading-relaxed">
            <TranslatedText tKey="footer_desc" defaultText="India's leading intelligent security planning ecosystem. We combine advanced hardware logic with certified human expertise." />
          </p>
          
          {/* Desktop: QR Code */}
          <div className="hidden md:block w-fit">
            <WhatsAppQR size={120} />
          </div>

          {/* Mobile: Quick Direct WhatsApp Chat Button */}
          <div className="md:hidden">
            <a
              href="https://wa.me/917357612865?text=Hi%20CCTVQuotation%20Team!%20I'm%20interested%20in%20CCTV%20Setup%20on%20EMI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Direct WhatsApp Support (+91 73576 12865)</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-5 sm:gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span className="text-xs sm:text-sm font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest"><TranslatedText tKey="footer_secure" defaultText="Secure & Verified Platform" /></span>
          </div>
          
          <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 items-center md:justify-end">
             <span className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
               🇮🇳 <TranslatedText tKey="footer_serving" defaultText="Serving Jaipur & All Across India" />
             </span>
          </div>
          
          <div className="flex flex-wrap gap-x-4 gap-y-2 sm:gap-8 text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
             <Link href="/customer/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><TranslatedText tKey="footer_customer_portal" defaultText="Customer Portal" /></Link>
             <Link href="/privacy-policy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><TranslatedText tKey="footer_privacy" defaultText="Privacy Policy" /></Link>
             <Link href="/terms-of-service" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><TranslatedText tKey="footer_terms" defaultText="Terms of Service" /></Link>
             <Link href="/partner/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><TranslatedText tKey="footer_partner" defaultText="Partner Login" /></Link>
          </div>
          
          <p className="text-[11px] sm:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mt-2 sm:mt-4">
            © {new Date().getFullYear()} CCTVQuotation — A TEAM Platform
          </p>
        </div>
      </div>
    </footer>
  );
}
