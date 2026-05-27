"use client";

import { Zap, Check } from "lucide-react";
import { Addon, AddonRuleResult } from "@/types";

interface AddonSelectorProps {
  addons: Addon[];
  evaluatedRules: Record<string, AddonRuleResult>;
  selectedAddonIds: string[];
  toggleAddon: (id: string) => void;
}

export function AddonSelector({ addons, evaluatedRules, selectedAddonIds, toggleAddon }: AddonSelectorProps) {
  const visibleAddons = addons.filter(a => {
    const ruleStatus = evaluatedRules[a.id!];
    return a.is_active && ruleStatus && ruleStatus.action !== "hide";
  });

  if (visibleAddons.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
        <Zap className="w-5 h-5 text-blue-500" /> Extra Features
      </h3>
      <div className="space-y-3">
        {visibleAddons.map(addon => {
          const ruleStatus = evaluatedRules[addon.id!];
          const isMandatory = ruleStatus?.action === "show_mandatory";
          const isOutOfStock = addon.stock_quantity !== undefined && addon.stock_quantity <= 0;
          const isSelected = isMandatory || selectedAddonIds.includes(addon.id!);

          return (
            <label 
              key={addon.id} 
              className={`flex items-center gap-4 p-4 rounded-[24px] border-2 transition-all duration-300 ${
                isOutOfStock && !isMandatory ? "opacity-60 cursor-not-allowed" : "cursor-pointer group/addon"
              } ${
                isSelected 
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm" 
                : "border-transparent bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800"
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
                isSelected ? "bg-blue-600 border-blue-600 scale-110 shadow-lg shadow-blue-600/30" : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 group-hover/addon:border-zinc-400"
              }`}>
                 {isSelected && <Check className="w-3.5 h-3.5 text-white font-black" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={isSelected}
                disabled={isMandatory || isOutOfStock}
                onChange={() => {
                  if (!isOutOfStock) toggleAddon(addon.id!);
                }}
              />
              <div className="flex-1">
                <div className={`font-black text-[10px] leading-tight uppercase tracking-tight transition-colors ${isSelected ? "text-blue-900 dark:text-blue-100" : "text-zinc-900 dark:text-white"}`}>{addon.display_name}</div>
                <div className={`text-[10px] font-bold mt-1 tracking-widest transition-colors ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"}`}>+₹{(addon.price || addon.unit_price || 0).toLocaleString('en-IN')}</div>
              </div>
              {isOutOfStock && !isMandatory ? (
                 <span className="text-[8px] uppercase font-black text-red-500 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 rounded-full">Out of Stock</span>
              ) : isMandatory ? (
                 <span className="text-[8px] uppercase font-black text-zinc-400 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">Included</span>
              ) : null}
            </label>
          );
        })}
      </div>
    </div>
  );
}
