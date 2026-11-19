"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MapPin, 
  ShieldCheck, 
  Smartphone, 
  Receipt, 
  Search, 
  ArrowRight,
  CheckCircle2,
  Wrench
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useI18nStore } from "@/lib/i18n/store";
import { getStateLanguage } from "@/lib/i18n/mapping";

export function PanIndiaCoverage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [pincode, setPincode] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePincodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPincodeError("");

    const clean = pincode.trim().replace(/\D/g, "");
    if (clean.length !== 6) {
      setPincodeError(t("pan_pincode_invalid", "Please enter a valid 6-digit Indian PIN code."));
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch(`/api/pincode/${clean}`);
      const data = await res.json();

      if (data && data.state) {
        useI18nStore.getState().setLocaleFromPincode(getStateLanguage(data.state));
      }

      router.push(`/wizard?pincode=${clean}`);
    } catch {
      router.push(`/wizard?pincode=${clean}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const coveragePillars = [
    {
      icon: MapPin,
      badge: t("pan_card1_badge", "Pan-India Reach"),
      title: t("pan_card1_title", "Local Technician Scheduling"),
      desc: t("pan_card1_desc", "Doorstep site survey and neat cabling coordinated directly for residential, shop, or commercial premises nationwide."),
      color: "blue"
    },
    {
      icon: ShieldCheck,
      badge: t("pan_card2_badge", "100% Genuine Hardware"),
      title: t("pan_card2_title", "Zero Scrap / Grey Market"),
      desc: t("pan_card2_desc", "Factory-sealed CP Plus, Hikvision & Prama cameras paired with genuine WD Purple or Seagate SkyHawk 24×7 surveillance drives."),
      color: "emerald"
    },
    {
      icon: Smartphone,
      badge: t("pan_card3_badge", "Zero Monthly Fee"),
      title: t("pan_card3_title", "Mobile Live View on Phone"),
      desc: t("pan_card3_desc", "Complete phone app setup for real-time mobile monitoring on Android & iOS with zero recurring monthly subscription charges."),
      color: "indigo"
    },
    {
      icon: Receipt,
      badge: t("pan_card4_badge", "18% GST Paid"),
      title: t("pan_card4_title", "ITC Tax-Compliant Bill"),
      desc: t("pan_card4_desc", "Input Tax Credit (ITC) ready official GST invoice with exact component rates. No surprise taxes or hidden fees at checkout."),
      color: "purple"
    }
  ];

  return (
    <section id="pan-india-coverage" className="py-16 md:py-24 px-4 sm:px-6 bg-white dark:bg-[#050B14] transition-colors border-t border-slate-100 dark:border-zinc-800/80">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t("pan_badge", "Pan-India Installation Network")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {t("pan_heading", "Pan-India CCTV Installation & Doorstep Service")}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-3 font-medium leading-relaxed">
            {t("pan_sub", "Certified local technicians, clean cabling, and 100% genuine brand hardware delivered and installed with standard 18% GST invoice across India.")}
          </p>
        </div>

        {/* 4 Pan-India Trust Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {coveragePillars.map((pillar, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-white/5 hover:border-blue-500/40 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-300 shadow-xs hover:shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                    <pillar.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                    {pillar.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {pillar.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                  {pillar.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t("pan_verified_standard", "Certified Standard")}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Universal Pincode Quick-Quote Launcher */}
        <div className="max-w-2xl mx-auto p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto text-left">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {t("pan_pincode_title", "Check Instant Quote for Your Pin Code")}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("pan_pincode_sub", "Enter your 6-digit Pin Code to compare CP Plus, Hikvision & Prama packages.")}
              </p>
            </div>
          </div>

          <form onSubmit={handlePincodeSubmit} className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-36">
              <input
                type="text"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setPincodeError("");
                }}
                placeholder={t("pan_pin_placeholder", "e.g. 110001")}
                maxLength={6}
                className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-sm font-semibold tracking-wider placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying || pincode.length !== 6}
              className="w-full sm:w-auto h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            >
              <span>{isVerifying ? t("pan_checking", "Verifying...") : t("pan_pincode_btn", "Get Quote")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {pincodeError && (
          <p className="text-center text-xs text-rose-500 font-semibold mt-2">
            {pincodeError}
          </p>
        )}

      </div>
    </section>
  );
}
