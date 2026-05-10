"use client";

import React, { useMemo } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import { SlidersHorizontal, IndianRupee, ShieldCheck, Zap, Maximize, Mic, Moon, Camera } from "lucide-react";

export function FullCustomizerPanel() {
  const { selection, updateSelection, pricing_results, products } = useConfiguratorStore();

  // Extract unique brands from cameras
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
    // If the slider is at 100k, we treat it as no limit
    if (val >= 100000) {
      updateSelection({ max_budget: null });
    } else {
      updateSelection({ max_budget: val });
    }
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm sticky top-24">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest leading-tight">
          Build Your Own System
        </h3>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Column 1: Brand & Focus */}
        <div className="space-y-5">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Preferred Brand</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateSelection({ brand_preference: "all" })}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  !selection.brand_preference || selection.brand_preference === "all"
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900"
                    : "bg-transparent text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                }`}
              >
                All Brands
              </button>
              {uniqueBrands.map(brand => (
                <button
                  key={brand}
                  onClick={() => updateSelection({ brand_preference: brand })}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    selection.brand_preference === brand
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-transparent text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Focus Point</label>
            <div className="flex flex-col gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1.5 rounded-xl">
              <button
                onClick={() => updateSelection({ focus_point: "price" })}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  selection.focus_point === "price"
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                }`}
              >
                <IndianRupee className="w-3.5 h-3.5" /> Best Price
              </button>
              <button
                onClick={() => updateSelection({ focus_point: "quality" })}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  selection.focus_point === "quality"
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Highest Quality
              </button>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800/80 my-2" />

        {/* Column 2: Budget Control */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Max Total Budget</label>
            <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
              {selection.max_budget ? `₹${selection.max_budget.toLocaleString()}` : "No Limit"}
            </span>
          </div>
          
          <div className="pt-2">
            <input 
              type="range" 
              min="10000" max="100000" step="1000"
              value={selection.max_budget || 100000}
              onChange={handleBudgetChange}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
            />
            <div className="flex justify-between mt-2 text-[10px] font-bold text-zinc-400">
              <span>₹10,000</span>
              <span>No Limit</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 leading-snug">
            Set your absolute maximum budget. We'll automatically filter out systems exceeding this cost.
          </p>
        </div>

        <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800/80 my-2" />

        {/* Column 3: Advanced Features */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Must-Have Features</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "mic", label: "Built-in Mic", icon: <Mic className="w-3 h-3" /> },
              { id: "color_night", label: "Color Night", icon: <Moon className="w-3 h-3" /> },
              { id: "ptz", label: "PTZ Rotation", icon: <Maximize className="w-3 h-3" /> },
              { id: "4mp", label: "4MP / 5MP", icon: <Camera className="w-3 h-3" /> },
            ].map(feat => {
              const isActive = (selection.requested_features || []).includes(feat.id);
              return (
                <button
                  key={feat.id}
                  onClick={() => toggleFeature(feat.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                      : "bg-zinc-50 border-zinc-100 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  <div className={`shrink-0 ${isActive ? "text-blue-500" : "text-zinc-400"}`}>
                    {feat.icon}
                  </div>
                  <span className="text-[11px] font-bold leading-tight">{feat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
