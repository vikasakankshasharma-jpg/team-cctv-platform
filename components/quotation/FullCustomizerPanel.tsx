"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import { calculateSystemScore } from "@/lib/system-score";
import { 
  Zap, 
  Maximize, 
  Mic, 
  Moon, 
  Camera, 
  ChevronDown, 
  ChevronUp,
  Monitor,
  Wrench,
  Star,
  Check,
  Search,
  X,
  Sparkles
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────────────
   FullCustomizerPanel  —  "Build Your Own Kit" Sidebar
   
   2-zone layout:
   Zone 1: Filters (Technology, Brand, Budget, Features)
   Zone 2: Component Picker (directly swap camera from a mini-catalog)
   ────────────────────────────────────────────────────────────────────────── */

export function FullCustomizerPanel() {
  const { selection, updateSelection, products, resetFilters, setActiveCheckoutOption } = useConfiguratorStore();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    brands: true,
    budget: true,
    features: false,
    tech: true,
    picker: true,
  });
  const [cameraSearch, setCameraSearch] = useState("");

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Extract unique brands and counts
  const brandStats = useMemo(() => {
    const stats: Record<string, number> = {};
    products.forEach(p => {
      if (p.category === "camera" && p.brand && p.is_active) {
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

  // ── Camera Picker Data ──
  const filteredCameras = useMemo(() => {
    let cameras = products.filter(p => p.category === "camera" && p.is_active);

    // Apply tech filter
    if (selection.technology && selection.technology !== "both" as any) {
      cameras = cameras.filter(p => p.technology === selection.technology);
    }

    // Apply brand filter
    const bp = selection.brand_preference?.toLowerCase();
    if (bp && bp !== "all" && bp !== "recommend" && bp !== "unsure") {
      cameras = cameras.filter(p => p.brand?.toLowerCase() === bp);
    }

    // Apply budget filter
    if (selection.max_budget) {
      cameras = cameras.filter(p => (p.unit_price * selection.camera_count) <= selection.max_budget!);
    }

    // Apply search
    if (cameraSearch.trim()) {
      const q = cameraSearch.toLowerCase();
      cameras = cameras.filter(p => 
        p.display_name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.technical_name?.toLowerCase().includes(q)
      );
    }

    // Sort by price
    cameras.sort((a, b) => a.unit_price - b.unit_price);

    return cameras;
  }, [products, selection.technology, selection.brand_preference, selection.max_budget, selection.camera_count, cameraSearch]);

  const handleSelectCamera = useCallback((cam: typeof products[0]) => {
    setActiveCheckoutOption({
      technology: cam.technology as "HD" | "IP",
      option: cam.id as any
    });
  }, [setActiveCheckoutOption]);

  const activeFilterCount = 
    (selection.brand_preference !== "all" && selection.brand_preference ? 1 : 0) +
    (selection.max_budget !== null && selection.max_budget !== undefined ? 1 : 0) +
    (selection.requested_features?.length || 0);

  const isSelected = (camId: string | undefined) => {
    return selection.selected_camera_id === camId;
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm lg:sticky lg:top-24">
      
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white dark:text-zinc-900" />
          </div>
          <div>
            <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-[0.15em]">Build Your Own Kit</h3>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Filter & pick components</p>
          </div>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button 
            onClick={resetFilters}
            className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        
        {/* ── Section: Technology ─────────────────────────────────── */}
        <div className="p-5 space-y-3">
          <button 
            onClick={() => toggleSection('tech')}
            className="w-full flex items-center justify-between group"
          >
            <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors uppercase tracking-[0.2em]">Technology</span>
            {expandedSections.tech ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
          
          {expandedSections.tech && (
            <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <button
                onClick={() => updateSelection({ technology: "HD" })}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg transition-all ${
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
                className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg transition-all ${
                  selection.technology === "IP"
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                }`}
              >
                <Zap className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest">Digital IP</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Section: Brands ──────────────────────────────────────── */}
        <div className="p-5 space-y-3">
          <button 
            onClick={() => toggleSection('brands')}
            className="w-full flex items-center justify-between group"
          >
            <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors uppercase tracking-[0.2em]">Brand</span>
            {expandedSections.brands ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
          
          {expandedSections.brands && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300 max-h-[180px] overflow-y-auto scrollbar-thin">
              <FilterRadio 
                label="All Brands" 
                count={null}
                isActive={selection.brand_preference === "all" || !selection.brand_preference}
                onClick={() => updateSelection({ brand_preference: "all" })}
              />
              {brandStats.map(([brand, count]) => (
                <FilterRadio 
                  key={brand}
                  label={brand} 
                  count={count}
                  isActive={selection.brand_preference === brand}
                  onClick={() => updateSelection({ brand_preference: brand })}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Section: Budget ──────────────────────────────────────── */}
        <div className="p-5 space-y-3">
          <button 
            onClick={() => toggleSection('budget')}
            className="w-full flex items-center justify-between group"
          >
            <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors uppercase tracking-[0.2em]">Price Range</span>
            {expandedSections.budget ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
          
          {expandedSections.budget && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Max Budget</span>
                <span className="text-[11px] font-black text-zinc-900 dark:text-white">
                  {selection.max_budget ? `₹${selection.max_budget.toLocaleString()}` : "No Limit"}
                </span>
              </div>
              <div className="px-1">
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

        {/* ── Section: Features ─────────────────────────────────────── */}
        <div className="p-5 space-y-3">
          <button 
            onClick={() => toggleSection('features')}
            className="w-full flex items-center justify-between group"
          >
            <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors uppercase tracking-[0.2em]">Features</span>
            {expandedSections.features ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
          
          {expandedSections.features && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              {[
                { id: "mic", label: "Built-in Mic", icon: <Mic className="w-3.5 h-3.5" /> },
                { id: "color_night", label: "Color Night Vision", icon: <Moon className="w-3.5 h-3.5" /> },
                { id: "ptz", label: "PTZ / Rotation", icon: <Maximize className="w-3.5 h-3.5" /> },
                { id: "4mp", label: "4MP+ Ultra HD", icon: <Camera className="w-3.5 h-3.5" /> },
                { id: "wifi", label: "WiFi / Wireless", icon: <Zap className="w-3.5 h-3.5" /> },
              ].map(feat => {
                const isActive = (selection.requested_features || []).includes(feat.id);
                return (
                  <button 
                    key={feat.id} 
                    onClick={() => toggleFeature(feat.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isActive 
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" 
                        : "bg-transparent border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${
                        isActive ? "bg-blue-600 border-blue-600" : "border-zinc-300 dark:border-zinc-600"
                      }`}>
                        {isActive && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={`text-[11px] font-bold ${isActive ? "text-blue-700 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400"}`}>{feat.label}</span>
                    </div>
                    <div className={`transition-colors ${isActive ? "text-blue-500" : "text-zinc-300 dark:text-zinc-600"}`}>{feat.icon}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
         ZONE 2:  Component Picker  —  Mini Camera Catalog
         ═══════════════════════════════════════════════════════════════ */}
      <div className="border-t-4 border-zinc-100 dark:border-zinc-800">
        <div className="p-5 space-y-3">
          <button 
            onClick={() => toggleSection('picker')}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.15em]">Pick Camera</span>
              <span className="text-[9px] font-black text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{filteredCameras.length}</span>
            </div>
            {expandedSections.picker ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
          </button>

          {expandedSections.picker && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={cameraSearch}
                  onChange={e => setCameraSearch(e.target.value)}
                  placeholder="Search cameras..."
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[11px] font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
                {cameraSearch && (
                  <button onClick={() => setCameraSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Camera List */}
              <div className="max-h-[380px] overflow-y-auto space-y-2 scrollbar-thin pr-1">
                {filteredCameras.length === 0 ? (
                  <div className="py-8 text-center">
                    <Camera className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-2" />
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No cameras match</p>
                  </div>
                ) : (
                  filteredCameras.map(cam => {
                    const { score } = calculateSystemScore(cam);
                    const selected = isSelected(cam.id);
                    return (
                      <button
                        key={cam.id}
                        onClick={() => handleSelectCamera(cam)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all duration-300 group/cam ${
                          selected
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-sm ring-1 ring-blue-500/20"
                            : "bg-white dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Mini Image or Icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            selected ? "bg-blue-100 dark:bg-blue-900/40" : "bg-zinc-50 dark:bg-zinc-800"
                          }`}>
                            {cam.image_url ? (
                              <img src={cam.image_url} alt="" className="w-10 h-10 object-contain" />
                            ) : (
                              <Camera className={`w-5 h-5 ${selected ? "text-blue-500" : "text-zinc-300 dark:text-zinc-600"}`} />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {cam.brand && (
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{cam.brand}</span>
                              )}
                              {cam.is_focus_product && (
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            <p className={`text-[11px] font-bold leading-tight line-clamp-2 transition-colors ${
                              selected ? "text-blue-700 dark:text-blue-300" : "text-zinc-700 dark:text-zinc-300"
                            }`}>
                              {cam.display_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] font-black text-zinc-900 dark:text-white">
                                ₹{cam.unit_price.toLocaleString("en-IN")}
                              </span>
                              <span className="text-[8px] font-bold text-zinc-400">/unit</span>
                              {score > 0 && (
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                                  score >= 70 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                                  : score >= 40 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                }`}>
                                  {score}/100
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Selected indicator */}
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
                            selected ? "bg-blue-600 border-blue-600" : "border-zinc-200 dark:border-zinc-700"
                          }`}>
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer Tip ───────────────────────────────────────────── */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5">
        <div className="p-3.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Expert Tip</div>
          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Selecting <b>Digital IP</b> provides 2x more clarity than Analog HD, recommended for retail & businesses.
          </p>
        </div>
      </div>

    </div>
  );
}


/* ── Reusable Filter Radio Button ──────────────────────────────────────── */
function FilterRadio({ label, count, isActive, onClick }: { label: string; count: number | null; isActive: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between group cursor-pointer py-1"
    >
      <div className="flex items-center gap-2.5">
        <div 
          className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
            isActive ? "bg-blue-600 border-blue-600 shadow-sm" : "border-zinc-200 dark:border-zinc-700 bg-transparent group-hover:border-zinc-400"
          }`}
        >
          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        <span className={`text-[11px] font-bold transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-300"}`}>
          {label}
        </span>
      </div>
      {count !== null && (
        <span className="text-[10px] font-black text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">{count}</span>
      )}
    </div>
  );
}
