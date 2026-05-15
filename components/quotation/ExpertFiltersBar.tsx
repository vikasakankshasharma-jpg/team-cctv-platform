"use client";

import React, { useMemo } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import { 
  SlidersHorizontal, 
  RotateCcw
} from "lucide-react";
import { BrandSelector } from "./filters/BrandSelector";
import { BudgetSlider } from "./filters/BudgetSlider";
import { FeatureToggleGrid } from "./filters/FeatureToggleGrid";
import { FocusToggle } from "./filters/FocusToggle";

export function ExpertFiltersBar() {
  const { selection, products, resetFilters } = useConfiguratorStore();

  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(p => {
      if (p.category === "camera" && p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [products]);

  const hasActiveFilters = 
    (selection.brand_preference && selection.brand_preference !== "all") ||
    selection.max_budget !== null ||
    (selection.requested_features && selection.requested_features.length > 0) ||
    selection.focus_point !== "price";

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] sm:rounded-[48px] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] mb-10 sm:mb-16 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[20px] bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0 shadow-xl">
            <SlidersHorizontal className="w-6 h-6 text-white dark:text-zinc-900" />
          </div>
          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">System Discovery Expert</h3>
            <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mt-0.5">Refine featured recommendations instantly</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button 
              onClick={resetFilters}
              className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white transition-all text-[11px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-[-90deg] transition-transform" /> 
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
        <BrandSelector brands={uniqueBrands} />
        <FocusToggle />
        <BudgetSlider />
        <FeatureToggleGrid />
      </div>
    </div>
  );
}

