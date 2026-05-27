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
  const { selection, updateSelection, toggleAddon, products, addons, resetFilters, setActiveCheckoutOption, compare_options, setCompareOptions } = useConfiguratorStore();
  const [activeTab, setActiveTab] = useState<Tab>("cameras");
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearch("");
    setActiveFilters({});
  };

  const filterCategories = useMemo(() => {
    if (activeTab === "cameras") {
      const brands = new Set<string>();
      const mps = new Set<string>();
      const types = new Set<string>();
      const lenses = new Set<string>();
      const nvs = new Set<string>();
      
      products.filter(p => p.category === "camera" && p.is_active).forEach(p => {
        if (p.brand) brands.add(p.brand);
        if (p.resolution_mp) mps.add(`${p.resolution_mp}MP`);
        if (p.form_factor) types.add(p.form_factor.charAt(0).toUpperCase() + p.form_factor.slice(1));
        if (p.lens_mm) lenses.add(`${p.lens_mm}mm`);
        if (p.night_vision_type) {
          const nv = p.night_vision_type;
          nvs.add(nv === "ir" ? "IR" : nv === "color" ? "Color" : nv === "dual_light" ? "Dual Light" : "Starlight");
        }
      });
      return [
        { key: "brand", label: "Brand", options: Array.from(brands).sort() },
        { key: "mp", label: "Megapixels", options: Array.from(mps).sort() },
        { key: "type", label: "Type", options: Array.from(types).sort() },
        { key: "lens", label: "Lens", options: Array.from(lenses).sort() },
        { key: "nv", label: "Night Vision", options: Array.from(nvs).sort() }
      ].filter(f => f.options.length > 0);
    } else if (activeTab === "recorders") {
      const brands = new Set<string>();
      const channels = new Set<string>();
      const types = new Set<string>();
      products.filter(p => p.category === "recorder" && p.is_active).forEach(p => {
        if (p.brand) brands.add(p.brand);
        if (p.channels) channels.add(`${p.channels} Ch`);
        if (p.technical_name?.toLowerCase().includes("nvr")) types.add("NVR");
        if (p.technical_name?.toLowerCase().includes("dvr")) types.add("DVR");
      });
      return [
        { key: "brand", label: "Brand", options: Array.from(brands).sort() },
        { key: "channels", label: "Channels", options: Array.from(channels).sort((a,b) => parseInt(a) - parseInt(b)) },
        { key: "type", label: "Type", options: Array.from(types).sort() },
      ].filter(f => f.options.length > 0);
    } else if (activeTab === "storage") {
      const capacities = new Set<string>();
      const types = new Set<string>();
      addons.filter(a => a.category === "storage" && a.is_active).forEach(a => {
        const match = a.display_name.match(/(\d+TB|\d+GB)/i);
        if (match) capacities.add(match[1].toUpperCase());
        
        const name = a.display_name.toLowerCase();
        
        if (a.storage_type === "Micro SD" || (!a.storage_type && (name.includes("sd card") || name.includes("micro sd") || name.includes("memory card")))) {
          types.add("Micro SD");
        } else if (a.storage_type === "Hard Disk" || (!a.storage_type && (name.includes("hard disk") || name.includes("hdd") || name.includes("purple") || name.includes("skyhawk")))) {
          types.add("Hard Disk");
        }
      });
      return [
        { key: "type", label: "Type", options: Array.from(types).sort() },
        { key: "capacity", label: "Capacity", options: Array.from(capacities).sort() }
      ].filter(f => f.options.length > 0);
    }
    return [];
  }, [activeTab, products, addons]);

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
    
    const appliedBrand = activeFilters.brand !== undefined ? activeFilters.brand : selection.brand_preference;
    if (appliedBrand && appliedBrand !== "all" && appliedBrand !== "recommend" && appliedBrand !== "unsure") {
      list = list.filter(p => p.brand?.toLowerCase() === appliedBrand.toLowerCase());
    }
    
    const appliedRes = activeFilters.mp !== undefined ? activeFilters.mp : selection.resolution_preference;
    if (appliedRes && appliedRes !== "all") {
      list = list.filter(p => `${p.resolution_mp}MP` === appliedRes.toUpperCase().trim());
    }

    if (activeFilters.type && activeFilters.type !== "all") {
      list = list.filter(p => p.form_factor && p.form_factor.toLowerCase() === activeFilters.type.toLowerCase());
    }
    if (activeFilters.lens && activeFilters.lens !== "all") {
      list = list.filter(p => `${p.lens_mm}mm` === activeFilters.lens);
    }
    if (activeFilters.nv && activeFilters.nv !== "all") {
      list = list.filter(p => {
        const nv = p.night_vision_type;
        const nvStr = nv === "ir" ? "IR" : nv === "color" ? "Color" : nv === "dual_light" ? "Dual Light" : "Starlight";
        return nvStr === activeFilters.nv;
      });
    }

    if (selection.requested_features && selection.requested_features.length > 0) {
      list = list.filter(cam => {
        const camFeats = (cam.features || []).map(f => f.toLowerCase());
        const name = (cam.display_name + " " + cam.technical_name).toLowerCase();
        const check = (tag: string) => {
          if (tag === "mic") return camFeats.some(f => f.includes("mic") || f.includes("audio")) || name.includes("mic") || name.includes("audio");
          if (tag === "color") return camFeats.some(f => f.includes("color")) || name.includes("color");
          if (tag === "ptz") return camFeats.some(f => f.includes("ptz")) || name.includes("ptz");
          return camFeats.some(f => f.includes(tag)) || name.includes(tag);
        };
        return selection.requested_features!.every(reqFeat => check(reqFeat.toLowerCase().trim()));
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.display_name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0));
  }, [products, selection.technology, selection.brand_preference, selection.resolution_preference, selection.requested_features, search, activeFilters]);

  const filteredRecorders = useMemo(() => {
    let list = products.filter(p => p.category === "recorder" && p.is_active);
    if (selection.technology && selection.technology !== "both" as any) list = list.filter(p => p.technology === selection.technology);
    list = list.filter(p => (p.max_cameras || p.channels || 0) >= selection.camera_count);
    
    if (activeFilters.brand && activeFilters.brand !== "all") {
      list = list.filter(p => p.brand === activeFilters.brand);
    }
    if (activeFilters.channels && activeFilters.channels !== "all") {
      list = list.filter(p => `${p.channels} Ch` === activeFilters.channels);
    }
    if (activeFilters.type && activeFilters.type !== "all") {
      list = list.filter(p => p.technical_name?.toLowerCase().includes(activeFilters.type.toLowerCase()));
    }
    
    if (search.trim()) list = list.filter(p => p.display_name.toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0));
  }, [products, selection.technology, selection.camera_count, search, activeFilters]);

  const filteredStorage = useMemo(() => {
    let list = addons.filter(a => a.category === "storage" && a.is_active);
    
    // Auto-filter for WiFi technology if not explicitly overridden by user filter
    if (!activeFilters.type && selection.technology === "WiFi") {
      list = list.filter(a => {
        const name = a.display_name.toLowerCase();
        return a.storage_type === "Micro SD" || (!a.storage_type && (name.includes("sd card") || name.includes("micro sd") || name.includes("memory card")));
      });
    } else if (activeFilters.type && activeFilters.type !== "all") {
      list = list.filter(a => {
        const name = a.display_name.toLowerCase();
        if (activeFilters.type === "Micro SD") {
          return a.storage_type === "Micro SD" || (!a.storage_type && (name.includes("sd card") || name.includes("micro sd") || name.includes("memory card")));
        }
        if (activeFilters.type === "Hard Disk") {
          return a.storage_type === "Hard Disk" || (!a.storage_type && (name.includes("hard disk") || name.includes("hdd") || name.includes("purple") || name.includes("skyhawk")));
        }
        return true;
      });
    }

    if (activeFilters.capacity && activeFilters.capacity !== "all") {
      list = list.filter(a => {
        const match = a.display_name.match(/(\d+TB|\d+GB)/i);
        return match && match[1].toUpperCase() === activeFilters.capacity;
      });
    }
    
    if (search.trim()) list = list.filter(a => (a.display_name || "").toLowerCase().includes(search.toLowerCase()) || (a.technical_name || "").toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => (a.unit_price || a.price || 0) - (b.unit_price || b.price || 0));
  }, [addons, search, activeFilters, selection.technology]);

  const filteredPower = useMemo(() => {
    const keyword = selection.technology === "IP" ? "poe" : "psu";
    let list = addons.filter(a => a.category === "addon" && (a.technical_name || a.display_name || "").toLowerCase().includes(keyword) && a.is_active);
    list = list.filter(a => (a.max_cameras || 0) >= selection.camera_count);
    if (search.trim()) list = list.filter(a => (a.display_name || "").toLowerCase().includes(search.toLowerCase()) || (a.technical_name || "").toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => (a.unit_price || a.price || 0) - (b.unit_price || b.price || 0));
  }, [addons, selection.technology, selection.camera_count, search]);

  const filteredAddons = useMemo(() => {
    let list = addons.filter(a => a.is_active);
    if (search.trim()) list = list.filter(a => (a.display_name || "").toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => (a.unit_price || a.price || 0) - (b.unit_price || b.price || 0));
  }, [addons, search]);

  const renderTabs = () => (
    <div className="flex overflow-x-auto shrink-0 scrollbar-none px-6 gap-6 border-b border-[#d2d2d7] dark:border-[#424245]">
      <TabButton active={activeTab === "cameras"} onClick={() => handleTabChange("cameras")} label="Cameras" />
      <TabButton active={activeTab === "recorders"} onClick={() => handleTabChange("recorders")} label="Recorders" />
      <TabButton active={activeTab === "storage"} onClick={() => handleTabChange("storage")} label="Storage" />
      <TabButton active={activeTab === "power"} onClick={() => handleTabChange("power")} label="Power" />
      <TabButton active={activeTab === "addons"} onClick={() => handleTabChange("addons")} label="Accessories" />
    </div>
  );

  const renderProductItem = (
    item: Product | Addon, 
    isSelected: boolean, 
    onSelect: () => void,
    isCustomOverride: boolean,
    onRemoveOverride?: () => void,
    requiredQuantity: number = 1
  ) => {
    const isOutOfStock = item.stock_quantity !== undefined && item.stock_quantity < requiredQuantity;
    const unitPrice = item.unit_price || ("price" in item ? item.price : 0) || 0;
    
    return (
      <div className={`p-5 rounded-[24px] border transition-all duration-300 flex flex-col h-full ${
        isSelected
          ? "bg-[#0071e3]/5 border-[#0071e3] shadow-[0_4px_12px_rgba(0,113,227,0.1)] ring-2 ring-[#0071e3]/20"
          : isOutOfStock
            ? "bg-[#f5f5f7] border-[#d2d2d7] opacity-60 grayscale"
            : "bg-white dark:bg-[#1d1d1f] border-[#d2d2d7] dark:border-[#424245] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[#86868b]"
      }`}>
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex items-start justify-between">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isSelected ? "bg-[#0071e3] text-white" : "bg-[#f5f5f7] dark:bg-[#2d2d2f] text-[#86868b]"}`}>
              {item.category === "camera" ? <Camera className="w-5 h-5" /> : <Server className="w-5 h-5" />}
            </div>
            {isCustomOverride && isSelected && (
              <span className="text-[10px] font-medium text-[#1d1d1f] bg-[#f5f5f7] border border-[#d2d2d7] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Pinned
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[15px] font-semibold leading-tight line-clamp-2 ${isSelected ? "text-[#0071e3]" : "text-[#1d1d1f] dark:text-[#f5f5f7]"}`}>
              {item.display_name}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white">₹{unitPrice.toLocaleString("en-IN")}</span>
              {"brand" in item && item.brand && (
                <span className="text-[11px] font-medium text-[#86868b]">
                  {item.brand}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-[#f5f5f7] dark:border-[#2d2d2f] flex flex-row items-center justify-between shrink-0">
          {isOutOfStock ? (
             <span className="text-[11px] font-semibold text-red-500 tracking-wider">
               {item.stock_quantity! <= 0 ? "Out of Stock" : `Only ${item.stock_quantity} left`}
             </span>
          ) : (
            <button 
              onClick={onSelect}
              className={`px-5 py-2 rounded-full text-xs font-medium transition-colors ${
                isSelected ? "bg-[#0071e3] text-white" : "bg-[#f5f5f7] dark:bg-[#2d2d2f] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e8e8ed] dark:hover:bg-[#3d3d3f]"
              }`}
            >
              {isSelected ? "Selected" : "Select"}
            </button>
          )}
          {isCustomOverride && isSelected && onRemoveOverride && (
            <button onClick={onRemoveOverride} className="text-[11px] font-medium text-red-500 hover:underline">
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }

  const renderAddonItem = (addon: Addon, isSelected: boolean, onToggle: () => void) => {
    const isOutOfStock = addon.stock_quantity !== undefined && addon.stock_quantity <= 0;
    
    return (
      <div className={`p-5 rounded-[24px] border transition-all duration-300 flex flex-col h-full ${
        isSelected
          ? "bg-[#0071e3]/5 border-[#0071e3] shadow-[0_4px_12px_rgba(0,113,227,0.1)] ring-2 ring-[#0071e3]/20"
          : isOutOfStock
            ? "bg-[#f5f5f7] border-[#d2d2d7] opacity-60 grayscale"
            : "bg-white dark:bg-[#1d1d1f] border-[#d2d2d7] dark:border-[#424245] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[#86868b]"
      }`}>
        <div className="flex-1 min-w-0 mb-4">
          <p className={`text-[15px] font-semibold leading-tight line-clamp-2 ${isSelected ? "text-[#0071e3]" : "text-[#1d1d1f] dark:text-[#f5f5f7]"}`}>
            {addon.display_name}
          </p>
          <span className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mt-2 block">₹{(addon.price || 0).toLocaleString()}</span>
        </div>
        <div className="mt-auto pt-4 border-t border-[#f5f5f7] dark:border-[#2d2d2f] flex flex-row items-center justify-end">
          {isOutOfStock ? (
             <span className="text-[11px] font-semibold text-red-500 tracking-wider">
               Out of Stock
             </span>
          ) : (
            <button 
              onClick={onToggle}
              className={`px-5 py-2 rounded-full text-xs font-medium transition-colors ${
                isSelected ? "bg-[#0071e3] text-white" : "bg-[#f5f5f7] dark:bg-[#2d2d2f] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e8e8ed] dark:hover:bg-[#3d3d3f]"
              }`}
            >
              {isSelected ? "Added" : "Add"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-[#fbfbfd] dark:bg-[#1d1d1f] border border-[#d2d2d7] dark:border-[#424245] rounded-[32px] overflow-hidden shadow-sm flex flex-col min-h-[600px] max-h-[800px]">
      
      {/* Header */}
      <div className="bg-[#fbfbfd] dark:bg-[#1d1d1f] px-6 py-6 border-b border-[#d2d2d7] dark:border-[#424245] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">Configuration Tool</h3>
          <p className="text-[13px] text-[#86868b] mt-1">Select and pin components to build a fully customized setup.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#2d2d2f] border border-[#d2d2d7] dark:border-[#424245] rounded-full text-[13px] font-medium text-[#1d1d1f] dark:text-white placeholder:text-[#86868b] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all shadow-sm"
          />
        </div>
      </div>

      {renderTabs()}

      {filterCategories.length > 0 && (
        <div className="px-6 py-4 border-b border-[#d2d2d7] dark:border-[#424245] bg-[#fbfbfd] dark:bg-[#1d1d1f] shrink-0">
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-1 no-scrollbar">
            {filterCategories.map(cat => {
              const defaultVal = cat.key === "brand" ? (selection.brand_preference === "recommend" || selection.brand_preference === "unsure" ? "all" : selection.brand_preference) : cat.key === "mp" ? selection.resolution_preference : "all";
              const currentVal = activeFilters[cat.key] !== undefined ? activeFilters[cat.key] : defaultVal;
              const isActive = currentVal && currentVal !== "all";
              
              return (
                <div key={cat.key} className="relative shrink-0 snap-start">
                  <select
                    value={currentVal || "all"}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, [cat.key]: e.target.value }))}
                    className={`appearance-none pr-8 pl-4 py-2 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#1d1d1f] dark:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] border-[#1d1d1f] dark:border-[#f5f5f7]"
                        : "bg-white dark:bg-[#2d2d2f] text-[#1d1d1f] dark:text-[#f5f5f7] border-[#d2d2d7] dark:border-[#424245] hover:border-[#86868b]"
                    }`}
                  >
                    <option value="all">{cat.label}</option>
                    {cat.options.map(opt => (
                      <option key={opt} value={opt}>{cat.label}: {opt}</option>
                    ))}
                  </select>
                  <ChevronDown className={`w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                     isActive ? "text-white dark:text-[#1d1d1f]" : "text-[#86868b]"
                  }`} />
                </div>
              );
            })}
            
            {Object.keys(activeFilters).some(k => activeFilters[k] !== "all") && (
              <button 
                onClick={() => setActiveFilters({})}
                className="shrink-0 snap-start flex items-center justify-center px-4 py-2 rounded-full text-xs font-medium bg-[#f5f5f7] dark:bg-[#2d2d2f] text-[#1d1d1f] dark:text-white hover:bg-[#e8e8ed] dark:hover:bg-[#3d3d3f] border border-transparent transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 scrollbar-thin content-start bg-white dark:bg-black">
        {activeTab === "cameras" && filteredCameras.map(cam => renderProductItem(
          cam, 
          selection.selected_camera_id === cam.id,
          () => {
            const exists = compare_options.find(c => c.technology === cam.technology && c.option === cam.id);
            if (!exists) {
              let newOptions = compare_options;
              if (newOptions.length >= 4) newOptions = [newOptions[0], ...newOptions.slice(2)];
              setCompareOptions([...newOptions, { technology: cam.technology as any, option: cam.id! }]);
            }
            setActiveCheckoutOption({ technology: cam.technology as any, option: cam.id! });
            updateSelection({ selected_camera_id: cam.id });
            document.getElementById("build-your-own")?.scrollIntoView({ behavior: "smooth", block: "start" });
          },
          !!selection.selected_camera_id,
          () => updateSelection({ selected_camera_id: undefined }),
          selection.camera_count
        ))}

        {activeTab === "recorders" && filteredRecorders.map(rec => renderProductItem(
          rec, selection.selected_recorder_id === rec.id, () => updateSelection({ selected_recorder_id: rec.id }), !!selection.selected_recorder_id, () => updateSelection({ selected_recorder_id: undefined })
        ))}

        {activeTab === "storage" && filteredStorage.map(hdd => renderProductItem(
          hdd, selection.selected_storage_id === hdd.id, () => updateSelection({ selected_storage_id: hdd.id }), !!selection.selected_storage_id, () => updateSelection({ selected_storage_id: undefined })
        ))}

        {activeTab === "power" && filteredPower.map(pwr => renderProductItem(
          pwr, selection.selected_power_id === pwr.id, () => updateSelection({ selected_power_id: pwr.id }), !!selection.selected_power_id, () => updateSelection({ selected_power_id: undefined })
        ))}

        {activeTab === "addons" && filteredAddons.map(addon => renderAddonItem(
          addon, selection.selected_addons.includes(addon.id!), () => toggleAddon(addon.id!)
        ))}
        
        {((activeTab === "cameras" && filteredCameras.length === 0) ||
          (activeTab === "recorders" && filteredRecorders.length === 0) ||
          (activeTab === "storage" && filteredStorage.length === 0) ||
          (activeTab === "power" && filteredPower.length === 0) ||
          (activeTab === "addons" && filteredAddons.length === 0)) && (
          <div className="py-12 text-center col-span-full">
            <p className="text-sm font-medium text-[#86868b]">No components match your search.</p>
          </div>
        )}
      </div>

    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-1 py-4 text-[14px] font-medium transition-all whitespace-nowrap border-b-2 -mb-px ${
        active 
          ? "border-[#1d1d1f] dark:border-[#f5f5f7] text-[#1d1d1f] dark:text-[#f5f5f7]" 
          : "border-transparent text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]"
      }`}
    >
      {label}
    </button>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
        active
          ? "bg-[#1d1d1f] dark:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] border-[#1d1d1f] dark:border-[#f5f5f7]"
          : "bg-white dark:bg-[#2d2d2f] text-[#1d1d1f] dark:text-[#f5f5f7] border-[#d2d2d7] dark:border-[#424245] hover:border-[#86868b]"
      }`}
    >
      {label}
    </button>
  );
}
