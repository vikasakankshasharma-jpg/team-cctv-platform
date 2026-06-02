"use client";

import { useConfiguratorStore } from "@/store/configurator";
import { Shield, HardDrive, Zap, Cable, Wrench, X, Plus, Activity } from "lucide-react";
import type { PricingResult, QuoteLineItem, QuoteAddon } from "@/types";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);

type CategoryKey = "Cameras" | "Recorder" | "Storage" | "Power" | "Infrastructure" | "Installation" | "Addons";

interface UnifiedItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

function getCategory(name: string, id: string): CategoryKey {
  const lowerName = name.toLowerCase();
  const lowerId = id.toLowerCase();

  if (lowerId === "labor_install" || lowerName.includes("installation")) return "Installation";
  if (lowerId.includes("connector") || lowerId === "cabling_material" || lowerName.includes("wiring") || lowerName.includes("conduit") || lowerName.includes("connector") || lowerName.includes("cable")) return "Infrastructure";
  if (lowerName.includes("recorder") || lowerName.includes("dvr") || lowerName.includes("nvr") || lowerName.includes("xvr")) return "Recorder";
  if (lowerName.includes("hard disk") || lowerName.includes("hdd") || lowerName.includes("purple") || lowerName.includes("skyhawk") || lowerName.includes("tb") || lowerName.includes("gb")) return "Storage";
  if (lowerName.includes("power") || lowerName.includes("supply") || lowerName.includes("poe") || lowerName.includes("psu") || lowerName.includes("smps")) return "Power";
  return "Cameras";
}

function groupItems(pricing: PricingResult) {
  const groups: Record<CategoryKey, UnifiedItem[]> = {
    Cameras: [],
    Recorder: [],
    Storage: [],
    Power: [],
    Infrastructure: [],
    Installation: [],
    Addons: []
  };

  pricing.items.forEach(item => {
    const cat = getCategory(item.display_name, item.product_id);
    groups[cat].push({
      id: item.product_id,
      name: item.display_name,
      qty: item.qty,
      price: item.line_total
    });
  });

  pricing.addons.forEach(addon => {
    groups.Addons.push({
      id: addon.addon_id,
      name: addon.display_name,
      qty: addon.qty || 1,
      price: addon.price * (addon.qty || 1)
    });
  });

  return groups;
}

function isDeepEqual(baseItems: UnifiedItem[], customItems: UnifiedItem[]) {
  if (baseItems.length !== customItems.length) return false;
  
  // Sort both by ID to compare deterministically
  const b = [...baseItems].sort((x, y) => x.id.localeCompare(y.id));
  const c = [...customItems].sort((x, y) => x.id.localeCompare(y.id));

  for (let i = 0; i < b.length; i++) {
    if (b[i].id !== c[i].id || b[i].qty !== c[i].qty || b[i].price !== c[i].price) {
      return false;
    }
  }
  return true;
}

const CATEGORY_ICONS: Record<CategoryKey, any> = {
  Cameras: Shield,
  Recorder: HardDrive,
  Storage: HardDrive, // Can use another icon if preferred
  Power: Zap,
  Infrastructure: Cable,
  Installation: Wrench,
  Addons: Plus
};

const CATEGORY_COLORS: Record<CategoryKey, string> = {
  Cameras: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
  Recorder: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10",
  Storage: "text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10",
  Power: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
  Infrastructure: "text-zinc-500 bg-zinc-50 dark:bg-zinc-500/10",
  Installation: "text-rose-500 bg-rose-50 dark:bg-rose-500/10",
  Addons: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
};

interface BaseQuoteSummaryProps {
  activePricing?: PricingResult;
}

export function BaseQuoteSummary({ activePricing }: BaseQuoteSummaryProps) {
  const { is_compare_mode, base_quote_pricing, base_tier_name, exitCompareMode } = useConfiguratorStore();

  if (!is_compare_mode || !base_quote_pricing || !activePricing) return null;

  const baseGroups = groupItems(base_quote_pricing);
  const customGroups = groupItems(activePricing);

  const categories: CategoryKey[] = ["Cameras", "Recorder", "Storage", "Power", "Infrastructure", "Installation", "Addons"];

  return (
    <div className="w-full bg-white dark:bg-[#1d1d1f] rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200 dark:border-zinc-800/50 sticky top-24 max-h-[80vh] overflow-y-auto overflow-x-hidden scrollbar-thin">
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-white dark:bg-[#1d1d1f] z-10 pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Activity className="w-3.5 h-3.5" /> Diff Viewer
          </span>
          <h3 className="text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
            Base vs Custom
          </h3>
        </div>
        <button 
          onClick={exitCompareMode}
          className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors shadow-sm"
          title="Exit Compare Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {categories.map(cat => {
          const bItems = baseGroups[cat];
          const cItems = customGroups[cat];

          if (bItems.length === 0 && cItems.length === 0) return null;

          const bTotal = bItems.reduce((sum, i) => sum + i.price, 0);
          const cTotal = cItems.reduce((sum, i) => sum + i.price, 0);
          const delta = cTotal - bTotal;

          const isMatch = isDeepEqual(bItems, cItems);
          const Icon = CATEGORY_ICONS[cat];
          const colorClass = CATEGORY_COLORS[cat];

          return (
            <div key={cat} className={`flex flex-col gap-3 transition-opacity duration-300 ${isMatch ? "opacity-60 hover:opacity-100" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                    {cat}
                  </h4>
                </div>
                {!isMatch && delta !== 0 && (
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-sm ${
                    delta > 0 
                      ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30' 
                      : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                  }`}>
                    {delta > 0 ? '+' : ''}{formatCurrency(delta)}
                  </span>
                )}
              </div>

              {isMatch ? (
                <div className="pl-10 text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
                  {bItems.map(i => `${i.qty}x ${i.name}`).join(', ')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-10">
                  {/* Base Column */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
                    <div className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2.5">
                      {base_tier_name} Tier
                    </div>
                    <div className="space-y-2">
                      {bItems.length > 0 ? bItems.map(i => (
                         <div key={i.id} className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-tight">
                           <span className="font-bold text-zinc-800 dark:text-zinc-300">{i.qty}x</span> {i.name}
                         </div>
                      )) : <div className="text-[12px] text-zinc-400 italic">None</div>}
                    </div>
                  </div>

                  {/* Custom Column */}
                  <div className="p-3 bg-blue-50/50 dark:bg-[#0071e3]/10 rounded-xl border border-blue-100 dark:border-[#0071e3]/30 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full pointer-events-none" />
                    <div className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-2.5">
                      Customized
                    </div>
                    <div className="space-y-2">
                      {cItems.length > 0 ? cItems.map(i => (
                         <div key={i.id} className="text-[12px] text-zinc-900 dark:text-zinc-100 font-medium leading-tight">
                           <span className="font-bold text-blue-600 dark:text-blue-400">{i.qty}x</span> {i.name}
                         </div>
                      )) : <div className="text-[12px] text-zinc-400 italic">None</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Base Total</span>
          <span className="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 line-through">
            {formatCurrency(base_quote_pricing.total_payable)}
          </span>
        </div>
        <div className="flex justify-between items-end mt-4">
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">Final Price</span>
            <span className="text-3xl font-black text-zinc-950 dark:text-white tracking-tighter leading-none">
              {formatCurrency(activePricing.total_payable)}
            </span>
          </div>
          {activePricing.total_payable - base_quote_pricing.total_payable !== 0 && (
             <div className="text-right">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Net Change</div>
                <div className={`text-[14px] font-black ${
                  activePricing.total_payable - base_quote_pricing.total_payable > 0 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {activePricing.total_payable - base_quote_pricing.total_payable > 0 ? '+' : ''}
                  {formatCurrency(activePricing.total_payable - base_quote_pricing.total_payable)}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

