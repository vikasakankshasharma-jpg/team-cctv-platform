"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { Zap, Wrench } from "lucide-react";
import { useUiStore } from "@/lib/ui-store";
import { useTranslation } from "@/hooks/useTranslation";

export function MobileStickyCtaBar() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { openServiceAreaModal } = useUiStore();
  const { t } = useTranslation();

  if (pathname?.startsWith("/wizard") || pathname?.startsWith("/pro-builder") || pathname?.startsWith("/quote")) return null;

  const handleWizardClick = () => {
    if (params?.city) {
      router.push(`/wizard?city=${params.city}`);
    } else {
      openServiceAreaModal();
    }
  };

  const handleProClick = () => {
    router.push(`/pro-builder`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="h-6 bg-gradient-to-t from-white/80 dark:from-zinc-950/80 to-transparent pointer-events-none" />
      <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex gap-2">
        <button
          onClick={handleWizardClick}
          className="flex-1 flex justify-center items-center gap-1.5 h-12 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-blue-500/30 transition-all active:scale-95 touch-manipulation"
        >
          <Zap className="w-3.5 h-3.5" />
          Wizard
        </button>
        <button
          onClick={handleProClick}
          className="flex-1 flex justify-center items-center gap-1.5 h-12 bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-zinc-900/20 transition-all active:scale-95 touch-manipulation"
        >
          <Wrench className="w-3.5 h-3.5" />
          Pro Builder
        </button>
      </div>
    </div>
  );
}
