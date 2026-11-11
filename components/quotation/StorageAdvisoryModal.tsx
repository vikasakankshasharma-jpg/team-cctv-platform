"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShieldCheck, AlertTriangle, Check, Sparkles, HardDrive, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface StorageAdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeTo1TB?: () => void;
  currentDays?: number;
}

export function StorageAdvisoryModal({
  isOpen,
  onClose,
  onUpgradeTo1TB,
  currentDays = 7,
}: StorageAdvisoryModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/80 dark:bg-zinc-900/90 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {t("adv_badge", "Market Transparency & Storage Advisory")}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {t("adv_title", "Understanding Storage & HDD Quality")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t("adv_sub", "Why hard drive selection is critical for 24×7 video security and data safety.")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label={t("pcm_close_aria", "Close modal")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Market reality context callout */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold">
                ⚠️
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
                  {t("adv_q_why", "Why do some competitor quotes look unusually cheap?")}
                </h4>
                <p className="text-[11px] sm:text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  {t("adv_why_pre", "Many offline vendors advertise cheap packages by secretly bundling")}{" "}
                  <strong>{t("adv_why_bold", "refurbished desktop hard drives (500GB)")}</strong>{" "}
                  {t("adv_why_post", "pulled from old PCs. While the cameras may be branded, a standard desktop drive is only built for 8 hours/day light computer use and frequently fails within 6 to 12 months under non-stop 24×7 CCTV recording.")}
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* 500GB Economy Card */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <span className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-white">
                    {t("adv_500_title", "Basic 500GB Economy Drive")}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                    {t("adv_500_badge", "Entry Storage")}
                  </span>
                </div>
                <ul className="space-y-2 text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 mt-3">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">•</span>
                    <span><strong>{t("adv_ret_lbl", "Retention:")}</strong> {t("adv_500_ret", "~7–8 Days backup (overwrites quickly).")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">•</span>
                    <span><strong>{t("adv_war_lbl", "Warranty:")}</strong> {t("adv_500_war", "1-Year Local Seller Warranty.")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">•</span>
                    <span><strong>{t("adv_grade_lbl", "Drive Grade:")}</strong> {t("adv_500_grade", "Refurbished / Pull desktop drive.")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">•</span>
                    <span><strong>{t("adv_risk_lbl", "Risk:")}</strong> {t("adv_500_risk", "Higher wear & heat failure risk under 24×7 continuous recording.")}</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-500">
                {t("adv_500_foot", "Suitable only if immediate upfront cost is the sole priority.")}
              </div>
            </div>

            {/* 1TB+ Genuine Surveillance Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/50 dark:from-blue-950/30 dark:to-zinc-800/60 border-2 border-blue-500/70 dark:border-blue-700/80 flex flex-col justify-between shadow-sm relative">
              <div className="absolute -top-2.5 right-4 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                {t("adv_rec_badge", "24×7 Surveillance Grade")}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-extrabold text-xs sm:text-sm text-blue-950 dark:text-blue-100">
                    {t("adv_1tb_title", "1TB+ Genuine Surveillance Drive")}
                  </span>
                </div>
                <p className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold mb-2">
                  Seagate SkyHawk™ / WD Purple™
                </p>
                <ul className="space-y-2 text-[11px] sm:text-xs text-blue-950 dark:text-zinc-300 mt-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span><strong>{t("adv_ret_lbl", "Retention:")}</strong> {t("adv_1tb_ret", "15 to 60+ Days safe storage.")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span><strong>{t("adv_war_lbl", "Warranty:")}</strong> {t("adv_1tb_war", "3-Year Direct Brand Replacement Warranty.")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span><strong>{t("adv_eng_lbl", "Engineered for 24×7:")}</strong> {t("adv_1tb_eng", "Built specifically to withstand non-stop video write cycles.")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span><strong>{t("adv_drop_lbl", "Zero Frame Drops:")}</strong> {t("adv_1tb_drop", "Specialized surveillance firmware (ImagePerfect / AllFrame).")}</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-200/60 dark:border-blue-900/60 text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{t("adv_1tb_foot", "100% Peace of mind for evidence & home security.")}</span>
              </div>
            </div>
          </div>

          {/* TEAM Transparency Statement */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 flex items-center gap-2.5 text-[11px] text-zinc-600 dark:text-zinc-400">
            <span className="text-base shrink-0">🛡️</span>
            <span>
              <strong>{t("adv_pol_lbl", "TEAM Integrity Policy:")}</strong>{" "}
              {t("adv_pol_body", "We disclose every component honestly so you make an informed decision without hidden surprises later.")}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/90 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white h-auto py-2 whitespace-normal text-center leading-snug"
          >
            {t("adv_keep_500", "Keep 500GB Economy")}
          </Button>
          {onUpgradeTo1TB && (
            <Button
              type="button"
              onClick={() => {
                onUpgradeTo1TB();
                onClose();
              }}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-sm h-auto py-2.5 whitespace-normal text-center leading-snug"
            >
              <span>{t("adv_upgrade_btn", "Upgrade to 1TB Surveillance Drive (3-Yr Warranty)")}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
