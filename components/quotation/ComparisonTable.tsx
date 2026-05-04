"use client";

import { useState, useMemo } from "react";
import { 
  Check, 
  ShieldCheck, 
  Zap, 
  Info, 
  ArrowRight,
  Monitor,
  Camera,
  Eye,
  Mic
} from "lucide-react";
import type { 
  Product, 
  AppSettings, 
  ConfiguratorSelection, 
  PricingResult,
  RecommendedOutput 
} from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";

interface ComparisonTableProps {
  cameraCount: number;
  recordingDays: number;
  products: Product[];
  addons: any[];
  settings: AppSettings;
  cablingDone: boolean;
  
  compareOptions: Array<{ technology: "HD" | "IP", option: number }>;
  onToggleCompare: (option: { technology: "HD" | "IP", option: number }) => void;
  activeCheckoutOption: { technology: "HD" | "IP", option: number } | null;
  onSelectCheckout: (option: { technology: "HD" | "IP", option: number }) => void;
  
  recommendation?: RecommendedOutput | null;
  promoterDiscount?: { percent: number; flat: number };
  evaluatedAddonRules: any;
}

export function ComparisonTable({
  cameraCount,
  recordingDays,
  products,
  addons,
  settings,
  cablingDone,
  compareOptions,
  onToggleCompare,
  activeCheckoutOption,
  onSelectCheckout,
  recommendation,
  promoterDiscount,
  evaluatedAddonRules
}: ComparisonTableProps) {
  // 1. Calculate pricing for all available options
  const rows = useMemo(() => {
    const allOptions: Array<{ technology: "HD"|"IP", opt: number }> = [
      { technology: "HD", opt: 1 },
      { technology: "HD", opt: 2 },
      { technology: "HD", opt: 3 },
      { technology: "IP", opt: 1 },
      { technology: "IP", opt: 2 },
      { technology: "IP", opt: 3 },
      { technology: "IP", opt: 4 },
      { technology: "IP", opt: 5 }
    ];
    
    return allOptions.map(({ technology, opt }) => {
      const selection: ConfiguratorSelection = {
        technology,
        camera_count: cameraCount,
        recording_days: recordingDays,
        selected_camera_option: opt,
        plan_type: "recommended", // Base for comparison
        selected_addons: [], // We don't include optional addons in the base comparison
        picture_quality: "good"
      };

      const pricing = calculatePricing({
        selection,
        products,
        addons,
        settings,
        cablingDone,
        referralDiscountPercent: promoterDiscount?.percent || 0,
        referralDiscountFlat: promoterDiscount?.flat || 0,
        evaluatedAddonRules
      });

      // Find camera product for metadata
      const camTechnicalName = technology === "IP" ? `cam_ip_opt${opt}` : `cam_hd_opt${opt}`;
      const camProduct = products.find(p => p.technical_name === camTechnicalName);

      return {
        technology,
        option: opt,
        pricing,
        camProduct,
        isRecommended: recommendation?.camera_option === opt && technology === "IP" // Admin rule usually defaults to IP 
      };
    }).sort((a, b) => a.pricing.total_payable - b.pricing.total_payable);
  }, [cameraCount, recordingDays, products, addons, settings, cablingDone, promoterDiscount, evaluatedAddonRules, recommendation]);

  // 2. Diff Logic (Price difference vs currently selected checkout option)
  const selectedPricing = activeCheckoutOption 
    ? rows.find(r => r.technology === activeCheckoutOption.technology && r.option === activeCheckoutOption.option)?.pricing 
    : undefined;

  return (
    <div className="w-full overflow-hidden rounded-[32px] border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-2xl backdrop-blur-md">
      {/* Mobile scroll hint */}
      <div className="md:hidden flex items-center justify-center gap-2 py-2 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800">
        <ArrowRight className="w-3 h-3 text-zinc-400 animate-bounce-x" />
        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Swipe to compare all options</span>
        <ArrowRight className="w-3 h-3 text-zinc-400 animate-bounce-x" />
      </div>
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800/60">
            <tr>
              <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] w-12 text-center">Compare</th>
              <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] min-w-[160px]">Model & Resolution</th>
              <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] hidden md:table-cell">Key Features</th>
              <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] text-right whitespace-nowrap">Total Price</th>
              <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] text-right">Pick</th>
              <th className="px-2 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
            {rows.map((row) => {
              const diff = selectedPricing ? row.pricing.total_payable - selectedPricing.total_payable : 0;
              const isComparing = compareOptions.some(co => co.technology === row.technology && co.option === row.option);
              const isCheckout = activeCheckoutOption?.technology === row.technology && activeCheckoutOption?.option === row.option;

              return (
                <tr 
                  key={`${row.technology}-${row.option}`} 
                  className={`group transition-all relative ${
                    isCheckout 
                    ? 'bg-blue-50/40 dark:bg-blue-500/10' 
                    : row.isRecommended 
                      ? 'bg-amber-50/20 dark:bg-amber-500/[0.03] hover:bg-amber-50/40 dark:hover:bg-amber-500/5'
                      : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'
                  }`}
                >
                  <td className="px-4 md:px-8 py-4 md:py-6 text-center">
                    <label className="cursor-pointer flex justify-center">
                       <input 
                         type="checkbox" 
                         className="hidden" 
                         checked={isComparing}
                         onChange={() => onToggleCompare({ technology: row.technology, option: row.option })}
                       />
                       <div className={`w-6 h-6 md:w-5 md:h-5 rounded-md border-2 flex items-center justify-center transition-all ${isComparing ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900' : 'border-zinc-300 dark:border-zinc-700'}`}>
                          {isComparing && <Check className="w-3.5 h-3.5 font-black" />}
                       </div>
                    </label>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => onSelectCheckout({ technology: row.technology, option: row.option })}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCheckout ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:bg-zinc-200 group-hover:text-zinc-900'}`}>
                        {row.technology === "IP" ? <Monitor className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-zinc-900 dark:text-white uppercase tracking-tight text-sm">{row.technology} Option {row.option}</span>
                          {row.isRecommended && (
                            <span className="px-2.5 py-1 bg-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-amber-500/20 animate-pulse">
                              <Zap className="w-2.5 h-2.5 fill-current" /> Best Value
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-tight line-clamp-1 max-w-[120px]">{row.camProduct?.display_name.split(' (')[0]}</span>
                           <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                             row.camProduct?.technical_name.includes('5mp') || row.camProduct?.technical_name.includes('4mp')
                             ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                             : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                           }`}>
                             {row.camProduct?.technical_name.includes('5mp') ? '5MP Ultra' : row.camProduct?.technical_name.includes('4mp') ? '4MP Pro' : '2MP Std'}
                           </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 hidden md:table-cell">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                          <Eye className="w-3 h-3 text-blue-500" /> 
                          {row.camProduct?.technical_name.includes('color') ? 'Full Color Night' : 'IR B&W Night'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                          <Mic className="w-3 h-3 text-blue-500" />
                          {row.camProduct?.technical_name.includes('mic') || row.option > 1 ? 'Audio In-built' : 'Visual Only'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-right whitespace-nowrap">
                    <div className="font-black text-zinc-900 dark:text-white text-base md:text-lg">₹{row.pricing.total_payable.toLocaleString('en-IN')}</div>
                    <div className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-tighter">Incl. GST</div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                    <button 
                      onClick={() => onSelectCheckout({ technology: row.technology, option: row.option })}
                      className={`px-3 md:px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                        isCheckout 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-zinc-900' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      {isCheckout ? '✓ Picked' : 'Pick'}
                    </button>
                  </td>
                  <td className="px-4 py-6 hidden"></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer Info */}
      <div className="bg-zinc-50 dark:bg-zinc-950/20 px-8 py-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">All prices include {cameraCount} cameras + {recordingDays} days storage + Installation</span>
         </div>
         <div className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest cursor-help flex items-center gap-1 group/help">
            <Info className="w-3 h-3 group-hover:rotate-12 transition-transform" /> View Hardware Breakdown
         </div>
      </div>
    </div>
  );
}
