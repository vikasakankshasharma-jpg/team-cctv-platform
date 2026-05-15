"use client";

import { CreditCard, Truck, Handshake, ShieldCheck, Download, Share2, Calendar, Loader2, ArrowRight, Wrench } from "lucide-react";
import { AppSettings, PricingResult } from "@/types";

interface ActionPanelProps {
  pricing: PricingResult;
  settings: AppSettings;
  isSaving: boolean;
  onAction: (action: "download" | "whatsapp" | "booking" | "accept") => void;
}

export function ActionPanel({ pricing, settings, isSaving, onAction }: ActionPanelProps) {
  return (
    <div className="lg:w-[400px] order-1 lg:order-2">
      <div className="sticky top-8 space-y-4 sm:space-y-6">
        
        {/* Total Investment Card */}
        <div className="bg-zinc-900 dark:bg-zinc-950 p-6 sm:p-8 rounded-[28px] sm:rounded-[32px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-48 h-48 bg-blue-500/20 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Investment</div>
          <div className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 transition-all duration-300">&#x20B9;{pricing.total_payable.toLocaleString('en-IN')}</div>
          
          <div className="pt-6 border-t border-zinc-800 flex justify-between items-center">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Incl. GST & Labor</span>
            <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="w-2.5 h-2.5" /> Best Value Match
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-4">
          <div className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Payment Schedule</div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 text-center gap-1.5 shadow-sm">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-black text-zinc-900 dark:text-white">10%</span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Advance</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 text-center gap-1.5 shadow-sm">
              <Truck className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-black text-zinc-900 dark:text-white">80%</span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Delivery</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 text-center gap-1.5 shadow-sm">
              <Handshake className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black text-zinc-900 dark:text-white">10%</span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Handover</span>
            </div>
          </div>

          <div className="pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">Optional After-Sales (AMC)</div>
            <div className="flex gap-2">
              <div className="flex-1 flex flex-col p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/50">
                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">1 Year</span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{settings.amc_1yr_pct ?? 15}% of total</span>
              </div>
              <div className="flex-1 flex flex-col p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/50">
                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">2 Year</span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{settings.amc_2yr_pct ?? 20}% of total</span>
              </div>
              <div className="flex-1 flex flex-col p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/50">
                <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">3 Year</span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{settings.amc_3yr_pct ?? 25}% of total</span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"><Wrench className="w-3 h-3"/> Post-Handover Visit</span>
              <span className="text-[10px] font-black text-zinc-900 dark:text-white">&#x20B9;{settings.visit_charge ?? 300} / visit</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 sm:space-y-4">
          <button
            onClick={() => onAction("accept")}
            disabled={isSaving}
            className="group relative w-full h-16 sm:h-20 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-sm tracking-[0.3em] rounded-[28px] sm:rounded-[32px] shadow-2xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 overflow-hidden touch-manipulation"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <ShieldCheck className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Accept Quote
                <ArrowRight className="w-5 h-5 translate-y-[1px]" />
              </>
            )}
          </button>

          <button
            onClick={() => onAction("download")}
            disabled={isSaving}
            className="group relative w-full h-14 sm:h-16 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-black uppercase text-[10px] tracking-widest rounded-[24px] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 border border-blue-600/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => onAction("whatsapp")}
              className="group relative h-14 sm:h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl sm:rounded-3xl flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 overflow-hidden touch-manipulation"
            >
              <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> WhatsApp
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => onAction("booking")}
              className="h-14 sm:h-16 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-black uppercase text-[10px] tracking-widest rounded-2xl sm:rounded-3xl flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700 shadow-lg touch-manipulation"
            >
              <Calendar className="w-4 h-4" /> Book Visit
            </button>
          </div>
        </div>

        {/* Terms Disclaimer */}
        <div className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed space-y-1 px-1">
          <p>• Product warranty as per company terms & conditions.</p>
          <p>• Warranty does not cover physically damaged accessories.</p>
          <p>• AMC includes site visits & labour — no product cost.</p>
          <p>• Quote valid for {settings.quote_validity_days ?? 15} days from issue date.</p>
        </div>

      </div>
    </div>
  );
}
