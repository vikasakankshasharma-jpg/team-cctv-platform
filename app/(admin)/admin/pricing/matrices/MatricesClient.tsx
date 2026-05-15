"use client";

import { useMemo, useState, useCallback } from "react";
import type { Product, AppSettings, Addon, PricingResult } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { ScenarioSimulator } from "@/components/admin/ScenarioSimulator";
import { Info, TrendingUp, DollarSign } from "lucide-react";

interface MatricesClientProps {
  products: Product[];
  settings: AppSettings;
  addons: Addon[];
}

interface MatrixCell {
  total: number;
  margin: number;
  result: PricingResult;
}

export function MatricesClient({ products, settings, addons }: MatricesClientProps) {
  const [activeTab, setActiveTab] = useState<"IP" | "HD">("IP");
  const [viewMode, setViewMode] = useState<"price" | "margin">("price");

  const cameraCounts = Array.from({ length: 16 }, (_, i) => i + 1);

  const calculateCell = useCallback((count: number, opt: number, tech: "IP" | "HD"): MatrixCell => {
    const res = calculatePricing({
      selection: {
        technology: tech,
        camera_count: count,
        selected_camera_option: opt,
        recording_days: tech === "IP" ? 15 : 7,
        plan_type: "recommended",
        picture_quality: "good",
        selected_addons: []
      },
      products, settings, addons, cablingDone: false, evaluatedAddonRules: {}
    });
    return {
      total: res.total_payable,
      margin: res.gross_profit_percent || 0,
      result: res
    };
  }, [products, settings, addons]);

  const ipMatrix = useMemo(() => {
    return cameraCounts.map(count => {
      const row: any = { cameras: count };
      [1, 2, 3, 4, 5].forEach(opt => {
        row[`opt${opt}`] = calculateCell(count, opt, "IP");
      });
      return row;
    });
  }, [cameraCounts, calculateCell]);

  const hdMatrix = useMemo(() => {
    return cameraCounts.map(count => {
      const row: any = { cameras: count };
      [1, 2].forEach(opt => {
        row[`opt${opt}`] = calculateCell(count, opt, "HD");
      });
      return row;
    });
  }, [cameraCounts, calculateCell]);

  const getMarginColor = (margin: number) => {
    const threshold = settings.minimum_margin_threshold || 15;
    if (margin < threshold) return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
    if (margin < threshold + 10) return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30";
    return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <div className="xl:col-span-8 space-y-6">
        <div className="bg-white dark:bg-zinc-900/40 rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="bg-zinc-50 dark:bg-zinc-950/40 px-8 py-6 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em] text-[10px] mb-1 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Dynamic Quotation Matrix
              </h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global pricing health check</p>
            </div>
            
            <div className="flex gap-4">
               {/* View Switcher */}
              <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl">
                <button 
                  onClick={() => setViewMode("price")}
                  className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === "price" ? "bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                >
                  <DollarSign className="w-3 h-3" /> Price
                </button>
                <button 
                  onClick={() => setViewMode("margin")}
                  className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === "margin" ? "bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                >
                  <TrendingUp className="w-3 h-3" /> Margin
                </button>
              </div>

              {/* Tech Switcher */}
              <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab("IP")}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "IP" ? "bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                >
                  IP
                </button>
                <button 
                  onClick={() => setActiveTab("HD")}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "HD" ? "bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                >
                  HD
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left border-separate border-spacing-2">
              <thead className="text-zinc-400 dark:text-zinc-600 uppercase text-[9px] font-black tracking-[0.2em]">
                <tr>
                  <th className="px-2 py-4 text-center">Cameras</th>
                  {activeTab === "IP" ? (
                    <>
                      <th className="px-2 py-4 text-right">Opt 1 (Budget)</th>
                      <th className="px-2 py-4 text-right">Opt 2 (Standard)</th>
                      <th className="px-2 py-4 text-right">Opt 3 (Color)</th>
                      <th className="px-2 py-4 text-right">Opt 4 (Prem. Color)</th>
                      <th className="px-2 py-4 text-right">Opt 5 (High Res)</th>
                    </>
                  ) : (
                    <>
                      <th className="px-2 py-4 text-right">Opt 1 (Standard)</th>
                      <th className="px-2 py-4 text-right">Opt 2 (Color)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="">
                {(activeTab === "IP" ? ipMatrix : hdMatrix).map((row: any) => (
                  <tr key={row.cameras} className="group">
                    <td className="px-2 py-3 text-center font-black text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950/20 rounded-xl text-xs">{row.cameras}</td>
                    {[1, 2, 3, 4, 5].filter(o => row[`opt${o}`]).map(o => {
                      const cell = row[`opt${o}`] as MatrixCell;
                      return (
                        <td 
                          key={o} 
                          className={`px-4 py-3 text-right font-black rounded-xl border transition-all hover:scale-[1.02] cursor-help relative group/cell ${getMarginColor(cell.margin)}`}
                          title={`Gross Profit: ₹${cell.result.gross_profit_value?.toLocaleString('en-IN')}\nPurchase Cost: ₹${cell.result.total_purchase_cost?.toLocaleString('en-IN')}`}
                        >
                          <div className="text-[11px]">
                            {viewMode === "price" ? `₹${cell.total.toLocaleString('en-IN')}` : `${cell.margin}%`}
                          </div>
                          {cell.margin < (settings.minimum_margin_threshold || 15) && (
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-4 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-6">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">
               <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" /> Healthy ({">"}25%)
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">
               <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" /> At Risk (15-25%)
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">
               <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" /> Danger ({"<"}15%)
            </div>
          </div>
        </div>
      </div>

      <div className="xl:col-span-4">
        <div className="sticky top-6">
          <ScenarioSimulator 
            products={products}
            settings={settings}
            addons={addons}
          />
        </div>
      </div>
    </div>
  );
}
