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
import { ResolutionSelector } from "./filters/ResolutionSelector";

export function ExpertFiltersBar() {
  const { selection, products, resetFilters } = useConfiguratorStore();

  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(p => {
      if (p.category === "camera" && p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [products]);

  const uniqueResolutions = useMemo(() => {
    const res = new Set<string>();
    products.forEach(p => {
      if (p.category === "camera" && p.resolution_mp) {
        // Extract standard megapixel formats like "2MP", "4MP", "5MP"
        const cleanRes = String(p.resolution_mp).toUpperCase().trim();
        if (cleanRes) res.add(cleanRes);
      }
    });
    // Sort numerically if possible (e.g., "2MP" before "4MP")
    return Array.from(res).sort((a, b) => {
      const numA = parseFloat(a.replace(/[^0-9.]/g, '')) || 0;
      const numB = parseFloat(b.replace(/[^0-9.]/g, '')) || 0;
      return numA - numB;
    });
  }, [products]);

  const hasActiveFilters = 
    (selection.brand_preference && selection.brand_preference !== "all") ||
    (selection.resolution_preference && selection.resolution_preference !== "all") ||
    selection.max_budget !== null ||
    (selection.requested_features && selection.requested_features.length > 0) ||
    selection.focus_point !== "price";

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] p-5 sm:p-6 shadow-sm mb-10 sm:mb-16">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-[12px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">System Discovery Expert</h3>
            <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mt-0.5">Refine Recommendations</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          <FocusToggle />
          {hasActiveFilters && (
            <button 
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all text-[9px] font-black uppercase tracking-widest shrink-0"
            >
              <RotateCcw className="w-3 h-3" /> 
              Reset Filters
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6 lg:gap-10">
        <div className="w-40">
          <BrandSelector brands={uniqueBrands} />
        </div>
        
        {selection.focus_point === "price" && (
          <div className="w-40">
            <ResolutionSelector resolutions={uniqueResolutions} />
          </div>
        )}
        
        <FeatureToggleGrid />
        
        <div className="flex-1 min-w-[200px] max-w-sm">
          {selection.focus_point === "price" ? (
            <BudgetSlider />
          ) : (
            <ResolutionSelector resolutions={uniqueResolutions} />
          )}
        </div>
      </div>
    </div>
  );
}

