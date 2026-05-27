"use client";

import { ShieldCheck, Wrench } from "lucide-react";
import { QuoteLineItem, QuoteAddon } from "@/types";

interface SystemSummaryProps {
  items: QuoteLineItem[];
  addons: QuoteAddon[];
  isCustomOverride?: boolean;
}

export function SystemSummary({ items, addons, isCustomOverride }: SystemSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">System Summary</h3>
        </div>
        {isCustomOverride && (
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50 px-2.5 py-1 rounded-full">
            <Wrench className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Custom Selection</span>
          </div>
        )}
      </div>

      <div className="rounded-[24px] border border-zinc-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
        <div className="px-4 py-3 sm:px-5 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-zinc-500">
          <span className="text-[10px] font-black uppercase tracking-widest">Item Description</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Line Total</span>
        </div>
        <div className="divide-y divide-zinc-100 dark:border-zinc-800/50">
          {items.map((item) => (
            <div key={item.product_id} className="flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5 group/item">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-6 h-6 mt-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-[10px] font-black text-zinc-600 dark:text-zinc-400 shrink-0 group-hover/item:bg-blue-100 group-hover/item:text-blue-600 transition-colors">
                  {item.qty}x
                </span>
                <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 leading-snug">
                  {item.brand ? <span className="font-black text-zinc-900 dark:text-white mr-1">{item.brand}</span> : null}
                  {item.display_name}
                </span>
              </div>
              <span className="text-[13px] font-black text-zinc-900 dark:text-white text-right shrink-0 mt-0.5">
                ₹{item.line_total.toLocaleString('en-IN')}
              </span>
            </div>
          ))}

          {addons.map((addon) => (
            <div key={addon.addon_id} className="flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5 group/item">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-6 h-6 mt-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[10px] font-black text-blue-600 dark:text-blue-400 shrink-0 group-hover/item:bg-blue-100 transition-colors">
                  {addon.qty ?? 1}x
                </span>
                <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 leading-snug">
                  {addon.display_name}
                </span>
              </div>
              <span className="text-[13px] font-black text-zinc-900 dark:text-white text-right shrink-0 mt-0.5">
                {addon.price < 0 ? "-" : ""}₹{Math.abs(addon.price).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
