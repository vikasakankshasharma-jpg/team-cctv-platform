"use client";

import { Zap } from "lucide-react";
import { useUiStore } from "@/lib/ui-store";
import { useTranslation } from "@/hooks/useTranslation";
import { useParams, useRouter } from "next/navigation";

export function GetQuotationButton() {
  const { openServiceAreaModal } = useUiStore();
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  
  const handleClick = () => {
    if (params?.city) {
      router.push(`/wizard?city=${params.city}`);
    } else {
      openServiceAreaModal();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-95 touch-manipulation"
    >
      <Zap className="w-3 h-3 group-hover:animate-pulse" />
      <span>{t('get_quote', 'Get Quotation')}</span>
    </button>
  );
}
