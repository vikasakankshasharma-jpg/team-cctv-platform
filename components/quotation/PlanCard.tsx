"use client";

import { Check, ChevronDown, ChevronUp, ShieldCheck, Sparkles, TrendingUp, Info, Cctv, Aperture, Video } from "lucide-react";
import { useState } from "react";
import type { PricingResult } from "@/types";

interface PlanCardProps {
  title: string;
  badge?: string;
  recommendation?: boolean;
  pricing: PricingResult;
  onSelect: () => void;
  isSelected?: boolean;
  showDetails?: boolean;
  onToggleDetails?: (show: boolean) => void;
  differenceAmount?: number;
  differenceType?: "save" | "extra";
  recommendationReason?: string;
}

export function PlanCard({ 
  title, 
  badge, 
  recommendation, 
  pricing, 
  onSelect, 
  isSelected,
  showDetails,
  onToggleDetails,
  differenceAmount,
  differenceType,
  recommendationReason
}: PlanCardProps) {
  const [internalShow, setInternalShow] = useState(false);
  
  const showItemized = showDetails !== undefined ? showDetails : internalShow;
  const setShowItemized = onToggleDetails ? onToggleDetails : setInternalShow;

  return (
    <div 
      className={`relative flex flex-col rounded-[40px] border transition-all duration-700 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl group
      ${recommendation 
        ? "border-blue-200 dark:border-blue-500/40 shadow-[0_48px_96px_rgba(37,99,235,0.15)] dark:shadow-[0_48px_96px_rgba(37,99,235,0.25)] sm:scale-[1.04] z-10" 
        : "border-zinc-100 dark:border-zinc-800 shadow-[0_24px_48px_rgba(0,0,0,0.04)] hover:border-zinc-200 dark:hover:border-blue-500/20 hover:shadow-[0_48px_96px_rgba(0,0,0,0.08)]"}`}
    >
      {/* Premium Badge */}
      {badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-zinc-900 dark:bg-blue-600 border border-zinc-800 dark:border-blue-500/50 rounded-full shadow-xl flex items-center gap-2 z-20 whitespace-nowrap">
          <Sparkles className="w-3 h-3 text-blue-400 dark:text-blue-100" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{badge}</span>
        </div>
      )}

      {/* Recommended visual indicator (glow) */}
      {recommendation && (
        <div className="absolute inset-0 bg-blue-50/30 dark:bg-blue-600/10 blur-[100px] -z-10 rounded-[40px]" />
      )}

      <div className="p-6 md:p-10 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
           <h3 className="text-sm font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{title}</h3>
           {recommendation && <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400" />}
        </div>
        
        <div className="flex items-end gap-1.5 mb-6 md:mb-10 pb-5 md:pb-8 border-b border-zinc-50 dark:border-zinc-800/60">
          <span className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">
            ₹{pricing.total_payable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-1.5 md:mb-2.5 ml-1">Final Price</span>
        </div>

        {/* Difference Amount Badge */}
        {differenceAmount !== undefined && differenceType && (
          <div className="mb-8 flex items-center justify-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-inner ${
              differenceType === 'save' 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' 
                : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20'
            }`}>
              {differenceType === 'save' ? <span>Save ₹{differenceAmount.toLocaleString('en-IN')}</span> : <span>Extra ₹{differenceAmount.toLocaleString('en-IN')}</span>}
            </span>
          </div>
        )}

        {/* Tier-Specific Feature Highlights */}
        <div className="space-y-5 flex-1 mb-8">
          {/* Row 1: Technology */}
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
               <Cctv className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 font-black" />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-black text-zinc-900 dark:text-zinc-200 leading-tight">{pricing.technology === "IP" ? "Smart Digital (IP)" : "HD Sharp (Analog)"}</span>
                <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">Camera System Technology</span>
            </div>
          </div>

          {/* Row 2: Tier-specific quality */}
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
               {title.toLowerCase().includes("premium") ? (
                 <Aperture className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
               ) : (
                 <Video className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
               )}
            </div>
            <div className="flex flex-col">
              {title.toLowerCase().includes("budget") ? (
                <>
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-200 leading-tight">Economy-Grade Hardware</span>
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">Best price, proven reliability</span>
                </>
              ) : title.toLowerCase().includes("premium") ? (
                <>
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-200 leading-tight">Premium Brand Hardware</span>
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">Top-tier quality & performance</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-200 leading-tight">Certified Quality Hardware</span>
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">Balanced quality & value</span>
                </>
              )}
            </div>
          </div>

          {/* Row 3: Warranty */}
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
               <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-black text-zinc-900 dark:text-zinc-200 leading-tight">1 Year Warranty</span>
                <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">Free On-Site Support & Repair</span>
            </div>
          </div>

          {/* Row 4: Tier-specific extras */}
          <div className="flex items-start gap-4">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              title.toLowerCase().includes("premium") ? "bg-amber-50 dark:bg-amber-900/20" : "bg-zinc-50 dark:bg-zinc-800/40"
            }`}>
               <Sparkles className={`w-3.5 h-3.5 ${
                 title.toLowerCase().includes("premium") ? "text-amber-500 dark:text-amber-400" : "text-zinc-300 dark:text-zinc-600"
               }`} />
            </div>
            <div className="flex flex-col">
              {title.toLowerCase().includes("budget") ? (
                <>
                  <span className="text-sm font-black text-zinc-400 dark:text-zinc-600 leading-tight line-through decoration-zinc-300">Extended Coverage</span>
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-600 mt-0.5">Available in higher tiers</span>
                </>
              ) : title.toLowerCase().includes("premium") ? (
                <>
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-200 leading-tight">Advanced Night Vision</span>
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">Crystal clear in total darkness</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-200 leading-tight">Enhanced Night Vision</span>
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">Clear footage in low light</span>
                </>
              )}
            </div>
          </div>
          
          {recommendation && recommendationReason && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
               <div className="flex items-center gap-2 mb-2">
                  <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Why this setup?</span>
               </div>
               <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed italic">
                 &quot;{recommendationReason}&quot;
               </p>
            </div>
          )}
        </div>

        {/* Interactive Itemization Toggle */}
        <div className={`transition-all duration-300 rounded-3xl border border-zinc-100 dark:border-zinc-800 ${showItemized ? "bg-zinc-50 dark:bg-black/40 p-6" : "p-4 hover:bg-zinc-50 dark:hover:bg-black/20"}`}>
          <button 
            onClick={() => setShowItemized(!showItemized)}
            className="flex items-center justify-between w-full text-left transition-colors"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {showItemized ? "Hide Setup Details" : "Show Setup Details"}
            </span>
            {showItemized ? <ChevronUp className="w-4 h-4 text-zinc-400 dark:text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />}
          </button>
          
          {showItemized && (
            <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                {pricing.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-3">
                    <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 leading-tight">{item.qty}x {item.display_name}</span>
                    <span className="text-[11px] font-black text-zinc-900 dark:text-white shrink-0">₹{item.line_total.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-tight">
                  <span>Cameras & Recorder</span>
                  <span>₹{pricing.base_hardware_cost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-tight">
                  <span>Wires & Pipes</span>
                  <span>₹{pricing.cabling_cost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-tight">
                  <span>Installation Work</span>
                  <span>₹{pricing.labor_cost.toLocaleString('en-IN')}</span>
                </div>
                {pricing.addons_total > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                    <span>Selected Extras</span>
                    <span>₹{pricing.addons_total.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {pricing.referral_discount > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                    <span>Loyalty Credit</span>
                    <span>-₹{pricing.referral_discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 mt-1 border-t border-zinc-200 dark:border-zinc-800 text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">
                  <span>Total before Tax</span>
                  <span>₹{pricing.net_taxable_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase">
                  <span>GST (Government Tax 18%)</span>
                  <span>₹{pricing.gst_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={onSelect}
          className={`
            w-full h-14 sm:h-16 rounded-2xl sm:rounded-3xl font-black uppercase text-xs tracking-[0.2em] transition-all mt-6 sm:mt-8 transform active:scale-[0.98] touch-manipulation
            ${isSelected 
              ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 shadow-inner" 
              : "bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 text-white shadow-xl dark:shadow-blue-500/20 shadow-zinc-900/20"}
          `}
        >
          {isSelected ? "Selected ✓" : "Choose this Plan"}
        </button>

      </div>
    </div>
  );
}
