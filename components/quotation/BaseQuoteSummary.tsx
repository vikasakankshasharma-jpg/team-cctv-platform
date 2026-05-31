"use client";

import { useConfiguratorStore } from "@/store/configurator";
import { Shield, HardDrive, Zap, Cable, Wrench, X, Sparkles, Plus } from "lucide-react";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);

export function BaseQuoteSummary() {
  const { is_compare_mode, base_quote_pricing, base_tier_name, exitCompareMode } = useConfiguratorStore();

  if (!is_compare_mode || !base_quote_pricing) return null;

  return (
    <div className="w-full bg-white dark:bg-[#1d1d1f] rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200 dark:border-zinc-800/50 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Base Template
          </span>
          <h3 className="text-2xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
            {base_tier_name} Tier
          </h3>
        </div>
        <button 
          onClick={exitCompareMode}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
          title="Exit Compare Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {/* Hardware Items */}
        {base_quote_pricing.items.map((item, idx) => {
          const lowerName = item.display_name.toLowerCase();
          let Icon = Shield;
          let iconColor = "text-blue-500";
          
          if (lowerName.includes("recorder") || lowerName.includes("dvr") || lowerName.includes("nvr")) {
            Icon = HardDrive;
            iconColor = "text-indigo-500";
          } else if (lowerName.includes("cable") || lowerName.includes("wire")) {
            Icon = Cable;
            iconColor = "text-zinc-500";
          } else if (lowerName.includes("power") || lowerName.includes("supply")) {
            Icon = Zap;
            iconColor = "text-amber-500";
          }

          return (
            <div key={`item-${idx}`} className="flex justify-between items-start pb-4 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 last:pb-0">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <h4 className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
                    {item.display_name}
                  </h4>
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Qty: {item.qty}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(item.line_total)}
                </div>
                <div className="text-[12px] text-zinc-400">
                  {formatCurrency(item.unit_price)} / ea
                </div>
              </div>
            </div>
          );
        })}

        {/* Addons */}
        {base_quote_pricing.addons.map((addon, idx) => (
          <div key={`addon-${idx}`} className="flex justify-between items-start pb-4 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 last:pb-0">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
                  {addon.display_name}
                </h4>
                {addon.qty && addon.qty > 1 && (
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Qty: {addon.qty}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
                {formatCurrency(addon.price * (addon.qty || 1))}
              </div>
              {addon.qty && addon.qty > 1 && (
                <div className="text-[12px] text-zinc-400">
                  {formatCurrency(addon.price)} / ea
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Labor */}
        <div className="flex justify-between items-start pb-4 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 last:pb-0">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h4 className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
                Installation & Configuration
              </h4>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
              {formatCurrency(base_quote_pricing.labor_cost)}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[15px] text-zinc-500 dark:text-zinc-400">Net Taxable</span>
          <span className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
            {formatCurrency(base_quote_pricing.net_taxable_amount)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-[15px] text-zinc-500 dark:text-zinc-400">GST ({base_quote_pricing.gst_rate}%)</span>
          <span className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
            {formatCurrency(base_quote_pricing.gst_amount)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-zinc-900 dark:text-white">Total</span>
          <span className="text-2xl font-bold text-zinc-900 dark:text-white">
            {formatCurrency(base_quote_pricing.total_payable)}
          </span>
        </div>
      </div>
    </div>
  );
}
