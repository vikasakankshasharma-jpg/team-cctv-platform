"use client";

import { useMemo, useState, useCallback } from "react";
import type { Product, AppSettings, Addon, PricingResult } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { ScenarioSimulator } from "@/components/admin/ScenarioSimulator";
import { Info, TrendingUp, DollarSign, Pencil, Save, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";

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

const RATE_FIELDS: { key: keyof AppSettings; label: string; unit: string; description: string }[] = [
  { key: "labor_hd_per_camera",       label: "HD Labor / Camera",         unit: "₹",  description: "Installation cost per HD camera" },
  { key: "labor_ip_per_camera",        label: "IP Labor / Camera",         unit: "₹",  description: "Installation cost per IP camera" },
  { key: "cable_copper_coated_hd",     label: "HD Cable / Meter",          unit: "₹",  description: "Copper-coated coax cable cost" },
  { key: "cable_copper_coated_ip",     label: "IP Cable / Meter",          unit: "₹",  description: "CAT6 cable cost per meter" },
  { key: "connector_rj45_cost",        label: "RJ45 Connectors (Pair)",    unit: "₹",  description: "Cost per pair of RJ45 connectors" },
  { key: "connector_bnc_dc_cost",      label: "BNC/DC Connectors (Set)",   unit: "₹",  description: "Cost per set of BNC/DC connectors" },
  { key: "high_reach_fee",             label: "High-Reach Fee",            unit: "₹",  description: "Extra fee for ceiling > 12ft" },
  { key: "amc_1yr_pct",                label: "AMC 1-Year %",              unit: "%",  description: "% of hardware cost for annual AMC" },
  { key: "gst_rate",                   label: "GST Rate",                  unit: "%",  description: "GST applied on net taxable amount" },
  { key: "minimum_margin_threshold",   label: "Min Margin Alert",          unit: "%",  description: "Below this margin, cells turn red" },
];

export function MatricesClient({ products, settings, addons }: MatricesClientProps) {
  const [activeTab, setActiveTab]   = useState<"IP" | "HD">("IP");
  const [viewMode, setViewMode]     = useState<"price" | "margin">("price");
  const [editMode, setEditMode]     = useState(false);
  const [liveSettings, setLiveSettings] = useState<AppSettings>(settings);
  const [saving, setSaving]         = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "err">("idle");

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
      products,
      settings: liveSettings,  // ← uses live-editable settings
      addons,
      cablingDone: false,
      evaluatedAddonRules: {}
    });
    return {
      total: res.total_payable,
      margin: res.gross_profit_percent || 0,
      result: res
    };
  }, [products, liveSettings, addons]);

  const ipMatrix = useMemo(() => cameraCounts.map(count => {
    const row: any = { cameras: count };
    [1, 2, 3, 4, 5].forEach(opt => { row[`opt${opt}`] = calculateCell(count, opt, "IP"); });
    return row;
  }), [cameraCounts, calculateCell]);

  const hdMatrix = useMemo(() => cameraCounts.map(count => {
    const row: any = { cameras: count };
    [1, 2].forEach(opt => { row[`opt${opt}`] = calculateCell(count, opt, "HD"); });
    return row;
  }), [cameraCounts, calculateCell]);

  const getMarginColor = (margin: number) => {
    const threshold = liveSettings.minimum_margin_threshold || 15;
    if (margin < threshold) return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
    if (margin < threshold + 10) return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30";
    return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  };

  const handleRateChange = (key: keyof AppSettings, raw: string) => {
    const val = parseFloat(raw);
    if (!isNaN(val)) {
      setLiveSettings(prev => ({ ...prev, [key]: val }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(liveSettings),
      });
      setSaveStatus(res.ok ? "ok" : "err");
    } catch {
      setSaveStatus("err");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleReset = () => {
    setLiveSettings(settings);
    setEditMode(false);
  };

  const hasChanges = JSON.stringify(liveSettings) !== JSON.stringify(settings);

  return (
    <div className="space-y-6">
      {/* ── RATE EDITOR PANEL ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-blue-500" /> Live Rate Editor
            </h3>
            <p className="text-[9px] text-zinc-500 mt-0.5 font-medium">Changes instantly update the matrix below. Click Save to push to production.</p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
            <button
              onClick={() => setEditMode(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                editMode
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <Pencil className="w-3 h-3" /> {editMode ? "Editing" : "Edit Rates"}
            </button>
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                  saveStatus === "ok"  ? "bg-emerald-500 text-white shadow-emerald-500/20" :
                  saveStatus === "err" ? "bg-red-500 text-white shadow-red-500/20" :
                  "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                } disabled:opacity-60`}
              >
                {saveStatus === "ok"  ? <><CheckCircle2 className="w-3 h-3" /> Saved!</> :
                 saveStatus === "err" ? <><AlertTriangle className="w-3 h-3" /> Failed</> :
                 saving ? "Saving…" :
                 <><Save className="w-3 h-3" /> Save to Production</>}
              </button>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {RATE_FIELDS.map(field => {
            const val = (liveSettings as any)[field.key];
            const origVal = (settings as any)[field.key];
            const changed = val !== origVal;
            return (
              <div key={field.key} className={`space-y-1.5 p-3 rounded-2xl transition-all ${changed ? "bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-500/30" : "bg-zinc-50 dark:bg-zinc-800/50"}`}>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">
                  {field.label}
                  {changed && <span className="ml-1.5 text-blue-500">●</span>}
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-zinc-400">{field.unit}</span>
                  <input
                    type="number"
                    disabled={!editMode}
                    value={val ?? ""}
                    onChange={e => handleRateChange(field.key, e.target.value)}
                    className={`w-full bg-transparent text-base font-black text-zinc-900 dark:text-white focus:outline-none transition-all ${
                      editMode ? "border-b-2 border-blue-500" : "cursor-default"
                    }`}
                  />
                </div>
                <p className="text-[8px] text-zinc-400 leading-tight">{field.description}</p>
                {changed && (
                  <p className="text-[8px] text-blue-500 font-bold">Was: {field.unit}{origVal}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MATRIX + SIMULATOR ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-md overflow-hidden">
            <div className="bg-zinc-50 dark:bg-zinc-900 px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em] text-[10px] mb-1 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Dynamic Quotation Matrix
                </h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global pricing health check</p>
              </div>

              <div className="flex gap-4">
                <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl">
                  <button onClick={() => setViewMode("price")} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === "price" ? "bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
                    <DollarSign className="w-3 h-3" /> Price
                  </button>
                  <button onClick={() => setViewMode("margin")} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === "margin" ? "bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
                    <TrendingUp className="w-3 h-3" /> Margin
                  </button>
                </div>

                <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl">
                  <button onClick={() => setActiveTab("IP")} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "IP" ? "bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>IP</button>
                  <button onClick={() => setActiveTab("HD")} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "HD" ? "bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>HD</button>
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
                <tbody>
                  {(activeTab === "IP" ? ipMatrix : hdMatrix).map((row: any) => (
                    <tr key={row.cameras} className="group">
                      <td className="px-2 py-3 text-center font-black text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-xs">{row.cameras}</td>
                      {[1, 2, 3, 4, 5].filter(o => row[`opt${o}`]).map(o => {
                        const cell = row[`opt${o}`] as MatrixCell;
                        return (
                          <td
                            key={o}
                            className={`px-4 py-3 text-right font-black rounded-xl border transition-all hover:scale-[1.02] cursor-help relative group/cell ${getMarginColor(cell.margin)}`}
                            title={`Gross Profit: ₹${cell.result.gross_profit_value?.toLocaleString("en-IN")}\nPurchase Cost: ₹${cell.result.total_purchase_cost?.toLocaleString("en-IN")}`}
                          >
                            <div className="text-[11px]">
                              {viewMode === "price" ? `₹${cell.total.toLocaleString("en-IN")}` : `${cell.margin}%`}
                            </div>
                            {cell.margin < (liveSettings.minimum_margin_threshold || 15) && (
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

            <div className="px-8 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-6">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" /> Healthy (&gt;25%)
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" /> At Risk (15-25%)
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" /> Danger (&lt;15%)
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4">
          <div className="sticky top-6">
            <ScenarioSimulator
              products={products}
              settings={liveSettings}
              addons={addons}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

