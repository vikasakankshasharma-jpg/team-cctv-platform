"use client";

import Link from "next/link";
import { UserCircle2, Briefcase, ArrowRight, Gift, Sparkles } from "lucide-react";
import { TranslatedText } from "@/components/shared/TranslatedText";

export function UnifiedLoginClient() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="p-6 sm:p-8 space-y-4">
        {/* Customer Portal */}
        <Link 
          href="/customer/login"
          className="group flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <UserCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg"><TranslatedText tKey="customer_portal" defaultText="Customer Portal" /></h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 font-medium"><TranslatedText tKey="ul_cust_desc" defaultText="View quotes, invoices & track installations" /></p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0 ml-2" />
        </Link>

        {/* Partner & Associate Portal */}
        <Link 
          href="/partner/login"
          className="group flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 border-amber-100 dark:border-amber-900/40 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg"><TranslatedText tKey="partner_portal_title" defaultText="Partner & Associate Portal" /></h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">₹500 / Deal</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 font-medium"><TranslatedText tKey="ul_partner_desc" defaultText="Refer & earn, track leads, commissions & EDM posters" /></p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors shrink-0 ml-2" />
        </Link>

        {/* Staff & Admin Portal */}
        <Link 
          href="/admin/login"
          className="group flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 hover:border-gray-900 dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg"><TranslatedText tKey="staff_partner_portal" defaultText="Staff Admin Portal" /></h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 font-medium"><TranslatedText tKey="ul_staff_desc" defaultText="Internal staff, installers & affiliates" /></p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors shrink-0 ml-2" />
        </Link>

        {/* Instant Associate Onboarding Callout */}
        <div className="pt-4 text-center text-xs text-gray-500 dark:text-zinc-400 border-t border-gray-100 dark:border-zinc-800">
          <TranslatedText tKey="ul_not_registered_partner" defaultText="New associate or partner?" />{" "}
          <Link href="/refer-and-earn" className="font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <TranslatedText tKey="ul_join_refer_earn" defaultText="Register for Refer & Earn (Free) →" />
          </Link>
        </div>
      </div>
    </div>
  );
}
