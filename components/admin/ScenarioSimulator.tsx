"use client";

import { useState, useMemo } from "react";
import { Calculator, AlertTriangle, IndianRupee, Tag, ShieldCheck } from "lucide-react";
import type { Product, AppSettings, ConfiguratorSelection, PricingResult, Addon } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";

interface ScenarioSimulatorProps {
  products: Product[];
  settings: AppSettings;
  addons: Addon[];
}

export function ScenarioSimulator({ products, settings, addons }: ScenarioSimulatorProps) {
  const [selection, setSelection] = useState<ConfiguratorSelection>({
    technology: "IP",
    camera_count: 4,
    selected_camera_option: 4,
    recording_days: 15,
    plan_type: "recommended",
    picture_quality: "good",
    selected_addons: [],
  });

  const result = useMemo(() => {
    return calculatePricing({
      selection,
      products,
      addons,
      settings,
      cablingDone: false,
      evaluatedAddonRules: {}
    });
  }, [selection, products, settings, addons]);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 shadow-md relative overflow-hidden">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <Calculator className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Scenario Simulator</h3>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Test pricing engine logic</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Technology</label>
          <select 
            value={selection.technology}
            onChange={(e) => setSelection({ ...selection, technology: e.target.value as "HD" | "IP" })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="IP">IP Camera System</option>
            <option value="HD">HD Camera System</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cameras</label>
          <input 
            type="number"
            min="1"
            max="32"
            value={selection.camera_count}
            onChange={(e) => setSelection({ ...selection, camera_count: Number(e.target.value) })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Option Index</label>
          <select 
            value={selection.selected_camera_option}
            onChange={(e) => setSelection({ ...selection, selected_camera_option: Number(e.target.value) })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
          >
            {selection.technology === "IP" ? (
              <>
                <option value={1}>Option 1 (Budget 2MP)</option>
                <option value={2}>Option 2 (Standard 2MP)</option>
                <option value={3}>Option 3 (Color 2MP)</option>
                <option value={4}>Option 4 (Premium Color 2MP)</option>
                <option value={5}>Option 5 (High Res 4MP+)</option>
              </>
            ) : (
              <>
                <option value={1}>Option 1 (Standard HD)</option>
                <option value={2}>Option 2 (Color/Premium HD)</option>
              </>
            )}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recording Days</label>
          <select 
            value={selection.recording_days}
            onChange={(e) => setSelection({ ...selection, recording_days: Number(e.target.value) })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value={7}>7 Days</option>
            <option value={15}>15 Days</option>
            <option value={30}>30 Days</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Results</h4>
        
        <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800">
          <span className="text-sm font-bold text-zinc-400">Total Payable</span>
          <span className="text-xl font-black text-white">₹{result.total_payable.toLocaleString('en-IN')}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Purchase Cost</div>
            <div className="text-lg font-bold text-zinc-300">₹{result.total_purchase_cost?.toLocaleString('en-IN') || 0}</div>
          </div>
          <div className={`p-4 rounded-xl border ${result.gross_profit_percent && result.gross_profit_percent < (settings.minimum_margin_threshold || 15) ? "bg-red-500/10 border-red-500/30" : "bg-emerald-500/10 border-emerald-500/30"}`}>
            <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Gross Margin</div>
            <div className="text-lg font-black">{result.gross_profit_percent}%</div>
          </div>
        </div>

        {result.margin_warnings && result.margin_warnings.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Margin Warnings</span>
            </div>
            <ul className="list-disc pl-5 text-sm text-red-300 space-y-1">
              {result.margin_warnings.map((warn, i) => <li key={i}>{warn}</li>)}
            </ul>
          </div>
        )}

        <div className="pt-4 mt-4 border-t border-zinc-800">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Line Items</div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
            {result.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                <span className="text-zinc-300">{item.qty}x {item.display_name}</span>
                <span className="text-white font-bold">₹{item.line_total.toLocaleString('en-IN')}</span>
              </div>
            ))}
            {result.addons.map((addon, i) => (
              <div key={`addon-${i}`} className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">+ {addon.display_name}</span>
                <span className="text-zinc-300 font-bold">₹{addon.price.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
