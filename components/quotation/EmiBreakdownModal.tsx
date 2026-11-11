"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, CreditCard, ShieldCheck, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface EmiBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  packageName?: string;
  onProceed?: () => void;
}

export function EmiBreakdownModal({
  isOpen,
  onClose,
  totalAmount,
  packageName,
  onProceed,
}: EmiBreakdownModalProps) {
  const { t } = useTranslation();
  const displayPackageName = packageName || t("emi_pkg_default", "CCTV Security Package");
  const [selectedTenure, setSelectedTenure] = useState<number>(3);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when modal is active to prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // EMI Plans Calculations
  const plans = [
    {
      months: 3,
      title: t("emi_m3", "3 Months"),
      monthly: Math.round(totalAmount / 3),
      totalCost: totalAmount,
      interest: 0,
      badge: t("emi_b3", "0% Interest • No Cost"),
      isNoCost: true,
      description: t("emi_d3", "Pay in 3 equal monthly installments with zero extra interest charges."),
    },
    {
      months: 6,
      title: t("emi_m6", "6 Months"),
      monthly: Math.round(totalAmount / 6),
      totalCost: totalAmount,
      interest: 0,
      badge: t("emi_b6", "No-Cost Option"),
      isNoCost: true,
      description: t("emi_d6", "Available as No Cost EMI on select credit & debit cards (HDFC, ICICI, Axis)."),
    },
    {
      months: 9,
      title: t("emi_m9", "9 Months"),
      monthly: Math.round((totalAmount * 1.045) / 9),
      totalCost: Math.round(totalAmount * 1.045),
      interest: Math.round(totalAmount * 0.045),
      badge: t("emi_b9", "Balanced Outflow"),
      isNoCost: false,
      description: t("emi_d9", "Lower monthly commitment at standard bank rate (~13-14% p.a.)."),
    },
    {
      months: 12,
      title: t("emi_m12", "12 Months"),
      monthly: Math.round((totalAmount * 1.06) / 12),
      totalCost: Math.round(totalAmount * 1.06),
      interest: Math.round(totalAmount * 0.06),
      badge: t("emi_b12", "Lowest Monthly Cost"),
      isNoCost: false,
      description: t("emi_d12", "Minimum monthly outflow to secure your home or business premises today."),
    },
  ];

  const banks = [
    "HDFC Bank",
    "ICICI Bank",
    "SBI Card",
    "Axis Bank",
    "Kotak Mahindra",
    "OneCard",
    "Federal Bank",
    "Bank of Baroda",
    "Bajaj Finserv",
  ];

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-4 sm:p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={t("emi_close_aria", "Close EMI details")}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-amber-400 text-slate-950">
              <CreditCard className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
              {t("emi_badge", "Affordable Payment Plans")}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {t("emi_title", "Flexible EMI Options")}
          </h3>
          <p className="text-xs text-blue-200/90 mt-0.5 leading-snug">
            {displayPackageName} • {t("emi_total_lbl", "Total:")} <strong className="text-white font-bold">₹{totalAmount.toLocaleString("en-IN")}</strong>
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="p-3.5 sm:p-5 space-y-3 overflow-y-auto">
          {/* Plan Selection Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
            <span>{t("emi_select_tenure", "Select EMI Tenure")}</span>
            <span className="text-[11px] font-normal text-zinc-500">{t("emi_gst_incl", "Hardware + Wiring + GST Included")}</span>
          </div>

          {/* All 4 Plans - Compact & High-Contrast */}
          <div className="space-y-2">
            {plans.map((p) => {
              const isSelected = selectedTenure === p.months;
              return (
                <div
                  key={p.months}
                  onClick={() => setSelectedTenure(p.months)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-blue-50/90 dark:bg-blue-950/60 border-blue-600 ring-2 ring-blue-500/25 shadow-xs"
                      : "bg-zinc-50/70 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                        isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-300 dark:border-zinc-600"
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white">
                            {t("emi_months_n", "{n} Months", { n: String(p.months) })}
                          </span>
                          <span className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            p.isNoCost
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          }`}>
                            {p.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-black text-blue-700 dark:text-blue-400">
                        ₹{p.monthly.toLocaleString("en-IN")}<span className="text-[10px] font-medium text-zinc-500">{t("emi_mo_suffix", "/mo")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-1.5 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800 flex items-start justify-between gap-2 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="leading-snug">{p.description}</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0 ml-2">
                      {t("emi_total_lbl", "Total:")} ₹{p.totalCost.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Supported Banks */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-2.5 sm:p-3 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              {t("emi_banks_lbl", "Supported Banks & Cards (Credit & Debit Card EMI):")}
            </span>
            <div className="flex flex-wrap gap-1">
              {banks.map((b) => (
                <span
                  key={b}
                  className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-2xs"
                >
                  {b}
                </span>
              ))}
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {t("emi_cardless", "+ Cardless EMI & Pay Later")}
              </span>
            </div>
          </div>

          {/* Reassurance banner */}
          <div className="rounded-2xl p-2.5 sm:p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-950 dark:text-emerald-200 leading-snug">
              <span className="font-bold">{t("emi_zero_title", "Zero Paperwork, Instant Setup:")}</span>{" "}
              {t("emi_zero_desc_pre", "Select EMI at checkout via Razorpay. You can also reserve your installation for just")}{" "}
              <strong>{t("emi_token_bold", "₹500 token advance")}</strong>{" "}
              {t("emi_zero_desc_post", "and pay the rest after testing!")}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t("emi_secured_by", "Secured by")} <strong>Razorpay</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-full text-xs font-semibold px-3 py-1.5 min-h-[32px] h-auto whitespace-normal leading-tight"
            >
              {t("emi_close", "Close")}
            </Button>
            {onProceed && (
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onProceed();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1 px-4 py-1.5 min-h-[32px] h-auto whitespace-normal leading-tight cursor-pointer"
              >
                <span>{t("emi_proceed", "Proceed with EMI")}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
