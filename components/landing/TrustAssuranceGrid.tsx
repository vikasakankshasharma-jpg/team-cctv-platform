"use client";

import React, { useState } from "react";
import { CreditCard, ShieldCheck, Wrench, Calendar, ArrowRight } from "lucide-react";
import { SiteVisitBookingModal } from "@/components/checkout/SiteVisitBookingModal";

export function TrustAssuranceGrid() {
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);

  return (
    <section className="py-10 md:py-16 px-4 sm:px-6 bg-white dark:bg-zinc-950 border-y border-slate-100 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Assurance 1: EMI */}
        <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 sm:p-6 rounded-2xl sm:rounded-[28px] bg-slate-50/70 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 transition-all hover:shadow-md">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">CCTV on Easy EMI</h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed font-medium">
              Flexible 3 to 18 month plans starting from just ₹649/mo on easy monthly EMI.
            </p>
          </div>
        </div>

        {/* Assurance 2: Genuine Brands */}
        <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 sm:p-6 rounded-2xl sm:rounded-[28px] bg-slate-50/70 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 transition-all hover:shadow-md">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">100% Genuine Brands</h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed font-medium">
              Factory-sealed boxes from CP Plus, Hikvision & Prama with official 18% GST warranty invoice.
            </p>
          </div>
        </div>

        {/* Assurance 3: Zero Labor Markup */}
        <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 sm:p-6 rounded-2xl sm:rounded-[28px] bg-slate-50/70 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 transition-all hover:shadow-md">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Zero Labor Markup</h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed font-medium">
              Standard local fitting rates with 15 meters of free cable pulling labor included per camera.
            </p>
          </div>
        </div>

        {/* Assurance 4: Free Site Survey */}
        <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 sm:p-6 rounded-2xl sm:rounded-[28px] bg-slate-50/70 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 transition-all hover:shadow-md">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">100% Free Site Survey</h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed font-medium mb-2">
              Unsure about blind spots? An engineer visits your property with zero obligation.
            </p>
            <button
              type="button"
              onClick={() => setIsSurveyModalOpen(true)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer py-1"
            >
              <span>Book Free Survey</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {isSurveyModalOpen && (
        <SiteVisitBookingModal
          isOpen={isSurveyModalOpen}
          onClose={() => setIsSurveyModalOpen(false)}
          quoteId="HOMEPAGE_DIRECT"
          leadId="HOMEPAGE_DIRECT"
          customerName=""
          customerMobile=""
          initialAddress=""
        />
      )}
    </section>
  );
}
