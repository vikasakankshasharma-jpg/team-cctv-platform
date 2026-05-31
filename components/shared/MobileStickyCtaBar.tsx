"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useUiStore } from "@/lib/ui-store";

/**
 * Sticky mobile CTA bar — appears only on mobile (md:hidden),
 * hidden on wizard pages (wizard has its own inline nav),
 * and on quote pages where the conversion is already done.
 */
export function MobileStickyCtaBar() {
  const pathname = usePathname();
  const { openServiceAreaModal } = useUiStore();

  // Hide on wizard and quote pages — they have their own CTAs
  if (pathname?.startsWith("/wizard") || pathname?.startsWith("/quote")) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      {/* Gradient fade so content above doesn't hard-clip */}
      <div className="h-6 bg-gradient-to-t from-white/80 dark:from-zinc-950/80 to-transparent pointer-events-none" />
      <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <button
          onClick={openServiceAreaModal}
          className="flex w-full justify-center items-center gap-2.5 h-14 bg-zinc-900 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-lg shadow-zinc-900/20 dark:shadow-blue-500/30 transition-all active:scale-95 touch-manipulation"
        >
          Get Free CCTV Quote
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
