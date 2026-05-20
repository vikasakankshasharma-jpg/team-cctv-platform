"use client";

import React, { useMemo, useState } from "react";
import { Info, IndianRupee, ShieldCheck } from "lucide-react";
import { calculatePricing } from "@/lib/pricing-engine";
import type { Product, Addon, AppSettings, AddonRuleResult } from "@/types";
import { SystemSummary } from "./SystemSummary";
import { X } from "lucide-react";

interface PriceRangeTickerProps {
  cameraCount: number;
  products: Product[];
  addons: Addon[];
  settings: AppSettings;
  cablingDone: boolean;
  promoterDiscount?: { percent: number; flat: number };
  evaluatedAddonRules: Record<string, AddonRuleResult>;
  activeOffer?: any;
  selection: any;
}

export function PriceRangeTicker({
  cameraCount,
  products,
  addons,
  settings,
  cablingDone,
  promoterDiscount,
  evaluatedAddonRules,
  activeOffer,
  selection
}: PriceRangeTickerProps) {
  const [modalData, setModalData] = useState<{ title: string; pricing: any } | null>(null);

  // Default to HD for absolute lowest, but respect selected tech if it's strictly IP
  const minTech = (selection.technology === "IP") ? "IP" : "HD";
  // Default to IP for absolute highest, but respect selected tech if it's strictly HD
  const maxTech = (selection.technology === "HD") ? "HD" : "IP";

  const { lowest, highest } = useMemo(() => {
    if (!products.length || !settings) return { lowest: null, highest: null };

    // Calculate absolute lowest (HD, Budget) ignoring all filters
    const lowestConfig = calculatePricing({
      selection: {
        camera_count: cameraCount,
        technology: minTech,
        plan_type: "budget",
        recording_days: 7,
        selected_addons: [],
        picture_quality: selection.picture_quality || "good",
        brand_preference: selection.brand_preference || "all",
        requested_features: selection.requested_features || [],
        max_budget: null,
        focus_point: "price",
        selected_camera_option: 1 // Lowest
      },
      products,
      addons,
      settings,
      cablingDone,
      referralDiscountPercent: promoterDiscount?.percent || 0,
      referralDiscountFlat: promoterDiscount?.flat || 0,
      evaluatedAddonRules,
      activeOffer
    });

    // Calculate absolute highest (IP, Premium) ignoring all filters
    const highestConfig = calculatePricing({
      selection: {
        camera_count: cameraCount,
        technology: maxTech,
        plan_type: "premium",
        recording_days: 30, // Maximize storage for highest quote
        selected_addons: [],
        picture_quality: selection.picture_quality || "crystal_clear",
        brand_preference: selection.brand_preference || "all",
        requested_features: selection.requested_features || [],
        max_budget: null,
        focus_point: "quality",
        selected_camera_option: 3 // Highest
      },
      products,
      addons,
      settings,
      cablingDone,
      referralDiscountPercent: promoterDiscount?.percent || 0,
      referralDiscountFlat: promoterDiscount?.flat || 0,
      evaluatedAddonRules,
      activeOffer
    });

    return { lowest: lowestConfig, highest: highestConfig };
  }, [cameraCount, products, addons, settings, cablingDone, promoterDiscount, evaluatedAddonRules, activeOffer, selection]);

  if (!lowest || !highest) return null;

  return (
    <>
      <div className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Market Insight for {cameraCount} Cameras
            </p>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Explore the absolute lowest and highest possibilities for your current filters.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setModalData({ title: `Absolute Lowest Configuration (${minTech})`, pricing: lowest })}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
          >
            <span className="text-xs font-black text-zinc-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Lowest</span>
            <span className="text-sm font-black text-zinc-900 dark:text-white flex items-center">
              <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
              {lowest.total_payable.toLocaleString()}
            </span>
          </button>

          <span className="text-zinc-300 dark:text-zinc-700 font-light">—</span>

          <button 
            onClick={() => setModalData({ title: `Ultimate Premium Configuration (${maxTech})`, pricing: highest })}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-amber-500 dark:hover:border-amber-500 transition-colors group"
          >
            <span className="text-xs font-black text-zinc-500 uppercase tracking-wider group-hover:text-amber-600 transition-colors">Highest</span>
            <span className="text-sm font-black text-zinc-900 dark:text-white flex items-center">
              <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
              {highest.total_payable.toLocaleString()}
            </span>
          </button>
        </div>
      </div>

      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 sm:p-8">
            <button 
              onClick={() => setModalData(null)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 text-xl font-black uppercase tracking-tight mb-6">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
              {modalData.title}
            </div>
            <SystemSummary items={modalData.pricing.items} addons={modalData.pricing.addons} />
          </div>
        </div>
      )}
    </>
  );
}
