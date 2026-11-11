"use client";

import React from "react";
import { CheckCircle2, XCircle, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

export function DealerComparisonTable() {
  const { t } = useTranslation();
  const comparisonItems = [
    {
      title: t("comp_item1_t"),
      us: t("comp_item1_u"),
      dealer: t("comp_item1_d")
    },
    {
      title: t("comp_item2_t"),
      us: t("comp_item2_u"),
      dealer: t("comp_item2_d")
    },
    {
      title: t("comp_item3_t"),
      us: t("comp_item3_u"),
      dealer: t("comp_item3_d")
    },
    {
      title: t("comp_item4_t"),
      us: t("comp_item4_u"),
      dealer: t("comp_item4_d")
    },
    {
      title: t("comp_item5_t"),
      us: t("comp_item5_u"),
      dealer: t("comp_item5_d")
    },
    {
      title: t("comp_item6_t"),
      us: t("comp_item6_u"),
      dealer: t("comp_item6_d")
    }
  ];

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 bg-slate-50 dark:bg-zinc-950/40 transition-colors">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t("comp_badge")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {t("comp_heading")}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-3 font-medium">
            {t("comp_sub")}
          </p>
        </div>

        {/* Desktop: 2-Card Side-by-Side Comparison Grid (Zero Column Confusion) */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          
          {/* Card 1: Local CCTV Mechanic / Shop (The Problem) */}
          <div className="rounded-[32px] bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-zinc-800">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/50">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">{t("comp_offline_tag")}</span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{t("comp_offline_title")}</h3>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                {comparisonItems.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                      {item.title}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300 flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{item.dealer}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 text-center text-xs font-semibold text-slate-400 dark:text-zinc-500">
              {t("comp_offline_warn")}
            </div>
          </div>

          {/* Card 2: CCTVQuotation.com (The Solution) */}
          <div className="rounded-[32px] bg-gradient-to-b from-blue-50/60 to-white dark:from-blue-950/20 dark:to-zinc-900 border-2 border-blue-600 p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-blue-500/10 relative">
            <div className="absolute -top-3.5 right-8">
              <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                {t("comp_us_badge")}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3 pb-6 border-b border-blue-100 dark:border-blue-900/40">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">{t("comp_us_tag")}</span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">CCTVQuotation.com</h3>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                {comparisonItems.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-blue-100 dark:border-blue-900/40 shadow-2xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                      {item.title}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item.us}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{t("comp_us_warranty")}</span>
              </span>
              <Link
                href="/wizard"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs shrink-0"
              >
                <span>{t("get_quote")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

        {/* Mobile: Head-to-Head Comparative Cards (Eliminates Back-and-Forth Scrolling) */}
        <div className="lg:hidden space-y-4">
          {comparisonItems.map((item, idx) => (
            <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2.5">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {item.title}
              </div>
              
              {/* CCTVQuotation Advantage (Green / Blue) */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>CCTVQuotation.com</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {item.us}
                </div>
              </div>

              {/* Local Mechanic Shortcoming (Red) */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{t("comp_offline_title")}</span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400 leading-snug">
                  {item.dealer}
                </div>
              </div>
            </div>
          ))}

          {/* Mobile Bottom Quick Guarantee & CTA */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between gap-2 shadow-md">
            <div>
              <div className="text-xs font-black uppercase tracking-wider">{t("comp_mobile_guar")}</div>
              <div className="text-[11px] text-blue-100">{t("comp_us_warranty")}</div>
            </div>
            <Link
              href="/wizard"
              className="px-4 py-2 rounded-xl bg-white text-blue-700 font-bold text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-transform shrink-0"
            >
              {t("get_quote")}
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
