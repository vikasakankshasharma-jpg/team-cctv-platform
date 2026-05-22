"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import { calculateSystemScore } from "@/lib/system-score";
import { 
  Zap, Maximize, Mic, Moon, Camera, Server, HardDrive, Plug, PlusCircle,
  Search, X, Sparkles, Check, ChevronDown, ChevronUp, Unlock, Lock, Wrench
} from "lucide-react";
import type { Product, Addon } from "@/types";

type Tab = "cameras" | "recorders" | "storage" | "power" | "addons";

export function FullCustomizerPanel() {
  const { selection, updateSelection, toggleAddon, products, addons, resetFilters, setActiveCheckoutOption } = useConfiguratorStore();
  const [activeTab, setActiveTab] = useState<Tab>("cameras");
  const [search, setSearch] = useState("");

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearch("");
  };

  const [localBrand, setLocalBrand] = useState<string>("all");

  // ─────────────────────────────────────────────
  // 1. CAMERAS
  // ─────────────────────────────────────────────
  const cameraStats = useMemo(() => {
    const stats: Record<string, number> = {};
    products.forEach(p => {
      if (p.category === "camera" && p.brand && p.is_active) {
        stats[p.brand] = (stats[p.brand] || 0) + 1;
      }
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const filteredCameras = useMemo(() => {
    let list = products.filter(p => p.category === "camera" && p.is_active);
    if (selection.technology && selection.technology !== "both" as any) {
      list = list.filter(p => p.technology === selection.technology);
    }
    
    if (localBrand && localBrand !== "all") {
      list = list.filter(p => p.brand?.toLowerCase() === localBrand.toLowerCase());
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.display_name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.unit_price - b.unit_price);
  }, [products, selection.technology, localBrand, search]);

  // ─────────────────────────────────────────────
  // 2. RECORDERS
  // ─────────────────────────────────────────────
  const filteredRecorders = useMemo(() => {
    let list = products.filter(p => p.category === "recorder" && p.is_active);
    if (selection.technology && selection.technology !== "both" as any) {
      list = list.filter(p => p.technology === selection.technology);
    }
    // Only show recorders that can support current camera count
    list = list.filter(p => (p.max_cameras || p.channels || 0) >= selection.camera_count);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.display_name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.unit_price - b.unit_price);
  }, [products, selection.technology, selection.camera_count, search]);

  // ─────────────────────────────────────────────
  // 3. STORAGE
  // ─────────────────────────────────────────────
  const filteredStorage = useMemo(() => {
    let list = products.filter(p => p.category === "accessory" && (p.technical_name || "").toLowerCase().includes("hdd") && p.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.display_name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.unit_price - b.unit_price);
  }, [products, search]);

  // ─────────────────────────────────────────────
  // 4. POWER
  // ─────────────────────────────────────────────
  const filteredPower = useMemo(() => {
    const keyword = selection.technology === "IP" ? "poe" : "psu";
    let list = products.filter(p => p.category === "accessory" && (p.technical_name || "").toLowerCase().includes(keyword) && p.is_active);
    list = list.filter(p => (p.max_cameras || 0) >= selection.camera_count);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.display_name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.unit_price - b.unit_price);
  }, [products, selection.technology, selection.camera_count, search]);

  // ─────────────────────────────────────────────
  // 5. ADDONS
  // ─────────────────────────────────────────────
  const filteredAddons = useMemo(() => {
    let list = addons.filter(a => a.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => a.display_name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.price - b.price);
  }, [addons, search]);

  // ─────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────
  const renderTabs = () => (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none p-4 pb-0">
      <TabButton active={activeTab === "cameras"} onClick={() => handleTabChange("cameras")} icon={<Camera className="w-3.5 h-3.5" />} label="Cameras" />
      <TabButton active={activeTab === "recorders"} onClick={() => handleTabChange("recorders")} icon={<Server className="w-3.5 h-3.5" />} label="NVR/DVR" />
      <TabButton active={activeTab === "storage"} onClick={() => handleTabChange("storage")} icon={<HardDrive className="w-3.5 h-3.5" />} label="Storage" />
      <TabButton active={activeTab === "power"} onClick={() => handleTabChange("power")} icon={<Plug className="w-3.5 h-3.5" />} label="Power" />
      <TabButton active={activeTab === "addons"} onClick={() => handleTabChange("addons")} icon={<PlusCircle className="w-3.5 h-3.5" />} label="Add-ons" />
    </div>
  );

  const renderProductItem = (
    item: Product, 
    isSelected: boolean, 
    onSelect: () => void,
    isCustomOverride: boolean,
    onRemoveOverride?: () => void
  ) => {
    return (
      <div className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col h-full ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-sm ring-1 ring-blue-500/20"
          : "bg-white dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
      }`}>
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-blue-100 dark:bg-blue-900/40" : "bg-zinc-50 dark:bg-zinc-800"}`}>
              {item.category === "camera" ? <Camera className="w-4 h-4 text-zinc-400" /> : <Server className="w-4 h-4 text-zinc-400" />}
            </div>
            {isCustomOverride && isSelected && (
              <span className="text-[8px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <Lock className="w-2 h-2" /> Pinned
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[13px] font-bold leading-tight line-clamp-2 ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-zinc-700 dark:text-zinc-300"}`}>
              {item.display_name}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-black text-zinc-900 dark:text-white">₹{(item.unit_price || 0).toLocaleString()}</span>
              {item.brand && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase">
                  {item.brand}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-row items-center justify-between shrink-0">
          <button 
            onClick={onSelect}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isSelected ? "bg-blue-600 text-white shadow-md" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
          {isCustomOverride && isSelected && onRemoveOverride && (
            <button onClick={onRemoveOverride} className="text-[9px] font-bold text-red-500 hover:underline">
              Remove Lock
            </button>
          )}
        </div>
      </div>
    );
  }

  const renderAddonItem = (addon: Addon, isSelected: boolean, onToggle: () => void) => (
    <div className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col h-full ${
      isSelected
        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-sm ring-1 ring-blue-500/20"
        : "bg-white dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
    }`}>
      <div className="flex-1 min-w-0 mb-4">
        <p className={`text-sm font-bold ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-zinc-700 dark:text-zinc-300"}`}>
          {addon.display_name}
        </p>
        <span className="text-sm font-black text-zinc-900 dark:text-white mt-1 block">₹{addon.price.toLocaleString()}</span>
      </div>
      <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-row items-center justify-end">
        <button 
          onClick={onToggle}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isSelected ? "bg-blue-600 text-white shadow-md" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {isSelected ? "Added" : "Add"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm flex flex-col min-h-[600px] max-h-[800px]">
      
      {/* Header */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-[0.15em]">Pro Customizer</h3>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Build Your Own Kit</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 border-b border-zinc-100 dark:border-zinc-800">
        {renderTabs()}
      </div>

      {/* Filters (Cameras only for now, can expand later) */}
      {activeTab === "cameras" && (
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            <FilterPill label="All Brands" active={!localBrand || localBrand === "all"} onClick={() => setLocalBrand("all")} />
            {cameraStats.slice(0, 4).map(([brand]) => (
               <FilterPill key={brand} label={brand} active={localBrand === brand} onClick={() => setLocalBrand(brand)} />
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[11px] font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 scrollbar-thin content-start">
        {activeTab === "cameras" && filteredCameras.map(cam => renderProductItem(
          cam, 
          selection.selected_camera_id === cam.id,
          () => {
            setActiveCheckoutOption({ technology: cam.technology as any, option: cam.id! });
            updateSelection({ selected_camera_id: cam.id });
          },
          !!selection.selected_camera_id,
          () => updateSelection({ selected_camera_id: undefined })
        ))}

        {activeTab === "recorders" && filteredRecorders.map(rec => renderProductItem(
          rec, 
          selection.selected_recorder_id === rec.id,
          () => updateSelection({ selected_recorder_id: rec.id }),
          !!selection.selected_recorder_id,
          () => updateSelection({ selected_recorder_id: undefined })
        ))}

        {activeTab === "storage" && filteredStorage.map(hdd => renderProductItem(
          hdd, 
          selection.selected_storage_id === hdd.id,
          () => updateSelection({ selected_storage_id: hdd.id }),
          !!selection.selected_storage_id,
          () => updateSelection({ selected_storage_id: undefined })
        ))}

        {activeTab === "power" && filteredPower.map(pwr => renderProductItem(
          pwr, 
          selection.selected_power_id === pwr.id,
          () => updateSelection({ selected_power_id: pwr.id }),
          !!selection.selected_power_id,
          () => updateSelection({ selected_power_id: undefined })
        ))}

        {activeTab === "addons" && filteredAddons.map(addon => renderAddonItem(
          addon,
          selection.selected_addons.includes(addon.id!),
          () => toggleAddon(addon.id!)
        ))}
        
        {/* Empty State */}
        {((activeTab === "cameras" && filteredCameras.length === 0) ||
          (activeTab === "recorders" && filteredRecorders.length === 0) ||
          (activeTab === "storage" && filteredStorage.length === 0) ||
          (activeTab === "power" && filteredPower.length === 0) ||
          (activeTab === "addons" && filteredAddons.length === 0)) && (
          <div className="py-8 text-center">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No items match</p>
          </div>
        )}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────
// UI Components
// ─────────────────────────────────────────────

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${
        active 
          ? "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/20" 
          : "border-transparent text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-md"
          : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-zinc-600"
      }`}
    >
      {label}
    </button>
  );
}
