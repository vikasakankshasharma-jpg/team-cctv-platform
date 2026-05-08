"use client";

import { useMemo, useState } from "react";
import type { Product, AppSettings, Addon } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { ScenarioSimulator } from "@/components/admin/ScenarioSimulator";

interface MatricesClientProps {
  products: Product[];
  settings: AppSettings;
  addons: Addon[];
}

export function MatricesClient({ products, settings, addons }: MatricesClientProps) {
  const [activeTab, setActiveTab] = useState<"IP" | "HD">("IP");

  const cameraCounts = Array.from({ length: 16 }, (_, i) => i + 1);

  const ipMatrix = useMemo(() => {
    return cameraCounts.map(count => {
      const row: Record<string, number> = { cameras: count };
      [1, 2, 3, 4, 5].forEach(opt => {
        const res = calculatePricing({
          selection: {
            technology: "IP",
            camera_count: count,
            selected_camera_option: opt,
            recording_days: 15,
            plan_type: "recommended",
            picture_quality: "good",
            selected_addons: []
          },
          products, settings, addons, cablingDone: false, evaluatedAddonRules: {}
        });
        row[`opt${opt}`] = res.total_payable;
      });
      return row;
    });
  }, [products, settings, addons, cameraCounts]);

  const hdMatrix = useMemo(() => {
    return cameraCounts.map(count => {
      const row: Record<string, number> = { cameras: count };
      [1, 2].forEach(opt => {
        const res = calculatePricing({
          selection: {
            technology: "HD",
            camera_count: count,
            selected_camera_option: opt,
            recording_days: 7,
            plan_type: "recommended",
            picture_quality: "good",
            selected_addons: []
          },
          products, settings, addons, cablingDone: false, evaluatedAddonRules: {}
        });
        row[`opt${opt}`] = res.total_payable;
      });
      return row;
    });
  }, [products, settings, addons, cameraCounts]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <div className="xl:col-span-8 space-y-6">
        <div className="bg-white dark:bg-zinc-900/40 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden backdrop-blur-md">
          <div className="bg-zinc-50 dark:bg-zinc-950/40 px-8 py-5 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
            <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-[0.1em] text-xs">Dynamic Quotation Matrix</h3>
            <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab("IP")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "IP" ? "bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
              >
                IP Systems
              </button>
              <button 
                onClick={() => setActiveTab("HD")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "HD" ? "bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
              >
                HD Systems
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto p-4">
            {activeTab === "IP" ? (
              <table className="w-full text-left text-sm">
                <thead className="text-zinc-400 dark:text-zinc-600 uppercase text-[9px] font-black tracking-widest border-b border-zinc-50 dark:border-zinc-800/40">
                  <tr>
                    <th className="px-4 py-4 text-center">Cameras</th>
                    <th className="px-4 py-4 text-right">Opt 1 (Budget)</th>
                    <th className="px-4 py-4 text-right">Opt 2 (Standard)</th>
                    <th className="px-4 py-4 text-right">Opt 3 (Color)</th>
                    <th className="px-4 py-4 text-right">Opt 4 (Prem. Color)</th>
                    <th className="px-4 py-4 text-right">Opt 5 (High Res)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                  {ipMatrix.map((row) => (
                    <tr key={row.cameras} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all">
                      <td className="px-4 py-3 text-center font-black text-zinc-500">{row.cameras}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">₹{row.opt1.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">₹{row.opt2.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">₹{row.opt3.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">₹{row.opt4.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">₹{row.opt5.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-zinc-400 dark:text-zinc-600 uppercase text-[9px] font-black tracking-widest border-b border-zinc-50 dark:border-zinc-800/40">
                  <tr>
                    <th className="px-4 py-4 text-center">Cameras</th>
                    <th className="px-4 py-4 text-right">Opt 1 (Standard)</th>
                    <th className="px-4 py-4 text-right">Opt 2 (Color/Premium)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                  {hdMatrix.map((row) => (
                    <tr key={row.cameras} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all">
                      <td className="px-4 py-3 text-center font-black text-zinc-500">{row.cameras}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">₹{row.opt1.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">₹{row.opt2.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
