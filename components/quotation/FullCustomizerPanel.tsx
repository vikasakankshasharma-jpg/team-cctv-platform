"use client";

import React, { useMemo, useState } from "react";
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
  ChevronDown, 
  ChevronUp,
  X,
  Database,
  Cpu,
  Monitor
} from "lucide-react";

export function FullCustomizerPanel() {
  const { selection, updateSelection, products, resetFilters } = useConfiguratorStore();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    brands: true,
    budget: true,
    features: true,
    tech: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Extract unique brands and counts
  const brandStats = useMemo(() => {
    const stats: Record<string, number> = {};
    products.forEach(p => {
      if (p.category === "camera" && p.brand) {
        stats[p.brand] = (stats[p.brand] || 0) + 1;
      }
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
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

  const clearFilters = () => {
    resetFilters();
  };

  const activeFilterCount = 
    (selection.brand_preference !== "all" ? 1 : 0) +
    (selection.max_budget !== null ? 1 : 0) +
    (selection.requested_features?.length || 0);

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm lg:sticky lg:top-24">
      
      {/* Header */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="w-4 h-4 text-zinc-900 dark:text-white" />
          <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em]">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button 
            onClick={clearFilters}
            className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        
        {/* Section: Technology */}
        <div className="p-6 space-y-4">
          <button 
            onClick={() => toggleSection('tech')}
            className="w-full flex items-center justify-between group"
          >
            <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors uppercase tracking-[0.2em]">Technology Choice</span>
            {expandedSections.tech ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
          </button>
          
          {expandedSections.tech && (
            <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <button
                onClick={() => updateSelection({ technology: "HD" })}
                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-lg transition-all ${
                  selection.technology === "HD"
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                }`}
              >
                <Monitor className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest">Analog HD</span>
              </button>
              <button
                onClick={() => updateSelection({ technology: "IP" })}
                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-lg transition-all ${
                  selection.technology === "IP"
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                }`}
              >
                <Cpu className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest">Digital IP</span>
              </button>
            </div>
          )}
        </div>

        {/* Section: Brands */}
        <div className="p-6 space-y-4">
          <button 
            onClick={() => toggleSection('brands')}
            className="w-full flex items-center justify-between group"
          >
            <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors uppercase tracking-[0.2em]">Top Brands</span>
            {expandedSections.brands ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
          </button>
          
          {expandedSections.brands && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div 
                onClick={() => updateSelection({ brand_preference: "all" })}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div 
                  className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                    selection.brand_preference === "all" || !selection.brand_preference ? "bg-blue-600 border-blue-600 shadow-sm" : "border-zinc-200 dark:border-zinc-700 bg-transparent group-hover:border-zinc-400"
                  }`}
                >
                  {(selection.brand_preference === "all" || !selection.brand_preference) && <ShieldCheck className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-[11px] font-bold transition-colors ${(selection.brand_preference === "all" || !selection.brand_preference) ? "text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"}`}>All Brands</span>
              </div>
              
              {brandStats.map(([brand, count]) => {
                const isSelected = selection.brand_preference === brand;
                return (
                  <div 
                    key={brand} 
                    onClick={() => updateSelection({ brand_preference: brand })}
                    className="flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                        isSelected ? "bg-blue-600 border-blue-600 shadow-sm" : "border-zinc-200 dark:border-zinc-700 bg-transparent group-hover:border-zinc-400"
                      }`}>
                        {isSelected && <ShieldCheck className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-[11px] font-bold transition-colors ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {brand}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Budget */}
        <div className="p-6 space-y-4">
          <button 
            onClick={() => toggleSection('budget')}
            className="w-full flex items-center justify-between group"
          >
            <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors uppercase tracking-[0.2em]">Price Range</span>
            {expandedSections.budget ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
          </button>
          
          {expandedSections.budget && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Max Budget</span>
                <span className="text-xs font-black text-zinc-900 dark:text-white">
                  {selection.max_budget ? `₹${selection.max_budget.toLocaleString()}` : "No Limit"}
                </span>
              </div>
              <div className="px-2">
                <input 
                  type="range" 
                  min="10000" max="100000" step="5000"
                  value={selection.max_budget || 100000}
                  onChange={handleBudgetChange}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section: Features */}
        <div className="p-6 space-y-4">
          <button 
            onClick={() => toggleSection('features')}
            className="w-full flex items-center justify-between group"
          >
            <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors uppercase tracking-[0.2em]">Advanced Features</span>
            {expandedSections.features ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
          </button>
          
          {expandedSections.features && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              {[
                { id: "mic", label: "Built-in Microphone", icon: <Mic className="w-3.5 h-3.5" /> },
                { id: "color_night", label: "Color Night Vision", icon: <Moon className="w-3.5 h-3.5" /> },
                { id: "ptz", label: "PTZ / Rotation", icon: <Maximize className="w-3.5 h-3.5" /> },
                { id: "4mp", label: "4MP / 5MP (Ultra HD)", icon: <Camera className="w-3.5 h-3.5" /> },
                { id: "wifi", label: "WiFi / Wireless", icon: <Zap className="w-3.5 h-3.5" /> },
              ].map(feat => {
                const isActive = (selection.requested_features || []).includes(feat.id);
                return (
                  <div 
                    key={feat.id} 
                    onClick={() => toggleFeature(feat.id)}
                    className="flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                          isActive ? "bg-blue-600 border-blue-600 shadow-md" : "border-zinc-200 dark:border-zinc-700 bg-transparent group-hover:border-zinc-400"
                        }`}
                      >
                        {isActive && <ShieldCheck className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-[11px] font-bold transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"}`}>{feat.label}</span>
                    </div>
                    <div className={`transition-colors ${isActive ? "text-blue-500" : "text-zinc-400"}`}>{feat.icon}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
      
      {/* Footer / Results Info */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6">
        <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Expert Tip</div>
          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Selecting <b>Digital IP</b> provides 2x more clarity than Analog HD, recommended for retail & businesses.
          </p>
        </div>
      </div>

    </div>
  );
}
