"use client";

import React, { useMemo } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import { 
  SlidersHorizontal, 
  IndianRupee, 
  ShieldCheck, 
  Zap, 
  Maximize, 
  Mic, 
  Moon, 
  Camera,
  RotateCcw,
  Target
} from "lucide-react";

export function ExpertFiltersBar() {
  const { selection, updateSelection, products, resetFilters } = useConfiguratorStore();

  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(p => {
      if (p.category === "camera" && p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [products]);

  const toggleFeature = (feature: string) => {
    const current = selection.requested_features || [];
    if (current.includes(feature)) {
      updateSelection({ requested_features: current.filter(f => f !== feature) });
    } else {
      updateSelection({ requested_features: [...current, feature] });
    }
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (val >= 100000) {
      updateSelection({ max_budget: null });
    } else {
      updateSelection({ max_budget: val });
    }
  };

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
        
        {/* Preferred Brand */}
        <div className="space-y-5">
          <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Preferred Brand
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateSelection({ brand_preference: "all" })}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                !selection.brand_preference || selection.brand_preference === "all"
                  ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500"
              }`}
            >
              All Brands
            </button>
            {uniqueBrands.map(brand => (
              <button
                key={brand}
                onClick={() => updateSelection({ brand_preference: brand })}
                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selection.brand_preference === brand
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Focus Point */}
        <div className="space-y-5">
          <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-blue-600" /> Selection Focus
          </label>
          <div className="flex gap-1.5 bg-zinc-100 dark:bg-zinc-800/30 p-1.5 rounded-[24px] border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => updateSelection({ focus_point: "price" })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${
                selection.focus_point === "price"
                  ? "bg-white dark:bg-zinc-700 shadow-xl text-zinc-900 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500"
              }`}
            >
              <IndianRupee className="w-4 h-4" /> Best Price
            </button>
            <button
              onClick={() => updateSelection({ focus_point: "quality" })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${
                selection.focus_point === "quality"
                  ? "bg-white dark:bg-zinc-700 shadow-xl text-zinc-900 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500"
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Quality
            </button>
          </div>
        </div>

        {/* Max Budget */}
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <IndianRupee className="w-3.5 h-3.5 text-blue-600" /> Max Budget
            </label>
            <span className="text-[10px] font-black text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
              {selection.max_budget ? `₹${selection.max_budget.toLocaleString()}` : "No Limit"}
            </span>
          </div>
          <div className="pt-2 px-1">
            <input 
              type="range" 
              min="10000" max="100000" step="5000"
              value={selection.max_budget || 100000}
              onChange={handleBudgetChange}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
            />
            <div className="flex justify-between mt-3 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">
              <span>₹10K</span>
              <span>No Limit</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-5">
          <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-blue-600" /> Must-Have Features
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "mic", label: "Mic", icon: <Mic className="w-3.5 h-3.5" /> },
              { id: "color_night", label: "Night", icon: <Moon className="w-3.5 h-3.5" /> },
              { id: "ptz", label: "PTZ", icon: <Maximize className="w-3.5 h-3.5" /> },
              { id: "4mp", label: "Ultra HD", icon: <Camera className="w-3.5 h-3.5" /> },
            ].map(feat => {
              const isActive = (selection.requested_features || []).includes(feat.id);
              return (
                <button
                  key={feat.id}
                  onClick={() => toggleFeature(feat.id)}
                  className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-800 dark:text-zinc-500"
                  }`}
                >
                   {isActive ? <ShieldCheck className="w-3.5 h-3.5" /> : feat.icon}
                  <span className="text-[9px] font-black uppercase tracking-widest">{feat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
