"use client";

import React, { useState } from "react";
import { X, Check, CreditCard, ShieldCheck, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  packageName = "CCTV Security Package",
  onProceed,
}: EmiBreakdownModalProps) {
  const [selectedTenure, setSelectedTenure] = useState<number>(3);

  if (!isOpen) return null;

  // EMI Plans Calculations
  const plans = [
    {
      months: 3,
      title: "3 Months (No Cost EMI)",
      monthly: Math.round(totalAmount / 3),
      totalCost: totalAmount,
      interest: 0,
      badge: "0% Interest • Recommended",
      isNoCost: true,
      description: "Pay over 3 months with absolutely zero extra interest charges.",
    },
    {
      months: 6,
      title: "6 Months (No Cost / Low Cost)",
      monthly: Math.round(totalAmount / 6),
      totalCost: totalAmount,
      interest: 0,
      badge: "Popular Choice",
      isNoCost: true,
      description: "Available as No Cost EMI on select cards (HDFC, ICICI, Axis).",
    },
    {
      months: 9,
      title: "9 Months (Standard Bank EMI)",
      monthly: Math.round((totalAmount * 1.045) / 9),
      totalCost: Math.round(totalAmount * 1.045),
      interest: Math.round(totalAmount * 0.045),
      badge: "Balanced Outflow",
      isNoCost: false,
      description: "Low monthly outflow at standard bank interest (~13-14% p.a.).",
    },
    {
      months: 12,
      title: "12 Months (Lowest Monthly EMI)",
      monthly: Math.round((totalAmount * 1.06) / 12),
      totalCost: Math.round(totalAmount * 1.06),
      interest: Math.round(totalAmount * 0.06),
      badge: "Lowest Monthly Cost",
      isNoCost: false,
      description: "Minimum monthly commitment to safeguard your premises today.",
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

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 sm:p-6 relative shrink-0">
          <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-2.5 sm:hidden" />
          
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close EMI details"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-blue-500/20 text-blue-300">
              <CreditCard className="w-4 h-4" />
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-300">
              Affordable Payment Plans
            </span>
          </div>

          <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white">
            Flexible EMI Options
          </h3>
          <p className="text-xs text-blue-200/80 mt-0.5 truncate">
            {packageName} • Total: <strong className="text-white">₹{totalAmount.toLocaleString("en-IN")}</strong>
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto">
          {/* Plan Selection Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-0.5">
              <span>Select EMI Tenure</span>
              <span className="text-[10px] sm:text-[11px] font-normal text-zinc-500">Hardware + Wiring + GST</span>
            </div>

            {plans.map((p) => {
              const isSelected = selectedTenure === p.months;
              return (
                <div
                  key={p.months}
                  onClick={() => setSelectedTenure(p.months)}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                      : "bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                        isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-300 dark:border-zinc-600"
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                            {p.months} Months
                          </span>
                          <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            p.isNoCost
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                          }`}>
                            {p.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-black text-blue-700 dark:text-blue-400">
                        ₹{p.monthly.toLocaleString("en-IN")}<span className="text-[10px] font-medium text-zinc-500">/mo</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="truncate">{p.description}</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0 ml-2">
                      Total: ₹{p.totalCost.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Supported Banks */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-3 sm:p-3.5 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-2">
              Supported Banks & Cards (Credit & Debit Card EMI):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {banks.map((b) => (
                <span
                  key={b}
                  className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-2xs"
                >
                  {b}
                </span>
              ))}
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                + Cardless EMI & Pay Later
              </span>
            </div>
          </div>

          {/* Reassurance banner */}
          <div className="rounded-2xl p-3 sm:p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] sm:text-xs text-emerald-900 dark:text-emerald-200 leading-snug">
              <span className="font-bold">Zero Paperwork, Instant Setup:</span>{" "}
              Choose EMI during checkout via Razorpay. You can also reserve your installation for just <strong>₹500 token advance</strong> and pay the rest after testing!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Secured by <strong>Razorpay</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-full text-xs font-semibold px-3 py-1 h-8"
            >
              Close
            </Button>
            {onProceed && (
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onProceed();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1 px-3.5 py-1 h-8"
              >
                <span>Proceed</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
