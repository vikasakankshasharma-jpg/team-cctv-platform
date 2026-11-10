"use client";

import { useMemo, useState, useCallback } from "react";
import type { Product, AppSettings, Addon, PricingResult } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { ScenarioSimulator } from "@/components/admin/ScenarioSimulator";
import {
  TrendingUp,
  DollarSign,
  Pencil,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Check
} from "lucide-react";

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

const RATE_FIELDS: {
  key: keyof AppSettings;
  label: string;
  unit: string;
  description: string;
  fallback: number;
}[] = [
  { key: "labor_hd_per_camera",          label: "HD Labor / Camera",         unit: "₹",  description: "Installation cost per HD camera", fallback: 400 },
  { key: "labor_ip_per_camera",          label: "IP Labor / Camera",         unit: "₹",  description: "Installation cost per IP camera", fallback: 500 },
  { key: "cable_copper_coated_hd",        label: "HD Cable / Meter",          unit: "₹",  description: "Copper-coated coax cable cost", fallback: 25 },
  { key: "cable_copper_coated_ip",        label: "IP Cable / Meter",          unit: "₹",  description: "CAT6 cable cost per meter", fallback: 40 },
  { key: "connector_rj45_cost",           label: "RJ45 Connectors (Pair)",    unit: "₹",  description: "Cost per pair of RJ45 connectors", fallback: 5 },
  { key: "connector_bnc_dc_cost",         label: "BNC/DC Connectors (Set)",   unit: "₹",  description: "Cost per set of BNC/DC connectors", fallback: 20 },
  { key: "high_reach_fee",                label: "High-Reach Fee",            unit: "₹",  description: "Extra fee for ceiling > 12ft", fallback: 500 },
  { key: "amc_1yr_pct",                   label: "AMC 1-Year %",              unit: "%",  description: "% of hardware cost for annual AMC", fallback: 5 },
  { key: "gst_rate",                      label: "GST Rate",                  unit: "%",  description: "GST applied on net taxable amount", fallback: 18 },
  { key: "labor_hd_fitting_only",         label: "HD Fitting (No Cabling)",   unit: "₹",  description: "Fitting rate per HD camera when site is pre-cabled", fallback: 200 },
  { key: "labor_ip_fitting_only",         label: "IP Fitting (No Cabling)",   unit: "₹",  description: "Fitting rate per IP camera when site is pre-cabled", fallback: 300 },
  { key: "labor_no_cabling_visit_charge", label: "Visit Fee (Pre-Cabled)",    unit: "₹",  description: "Visit mobilization fee when site is pre-cabled", fallback: 500 },
  { key: "labor_no_cabling_small_job_rate", label: "Small Job Flat Rate",     unit: "₹",  description: "Per-camera flat rate when camera count ≤ 2", fallback: 500 },
  { key: "minimum_margin_threshold",      label: "Min Margin Alert",          unit: "%",  description: "Below this margin, cells turn red", fallback: 15 },
  { key: "conduit_cost_per_meter",        label: "Conduit Pipe / Mtr",        unit: "₹",  description: "PVC conduit casing pipe per meter", fallback: 20 },
  { key: "cable_overage_per_mtr",         label: "Extra Cable / Mtr",         unit: "₹",  description: "Charge per meter beyond base 20m", fallback: 12 },
];

export function MatricesClient({ products, settings, addons }: MatricesClientProps) {
  const [activeTab, setActiveTab]         = useState<"IP" | "HD">("IP");
  const [viewMode, setViewMode]           = useState<"price" | "margin">("price");
  const [isEditorOpen, setIsEditorOpen]   = useState(false);
  const [editMode, setEditMode]           = useState(false);
  const [liveSettings, setLiveSettings]   = useState<AppSettings>(settings);
  const [saving, setSaving]               = useState(false);
  const [saveStatus, setSaveStatus]       = useState<"idle" | "ok" | "err">("idle");

  const cameraCounts = useMemo(() => Array.from({ length: 16 }, (_, i) => i + 1), []);

  const getFieldValue = useCallback((field: typeof RATE_FIELDS[number], targetSettings: AppSettings): number => {
    const v = (targetSettings as any)[field.key];
    if (typeof v === "number" && !isNaN(v)) return v;
    if (v !== undefined && v !== null && v !== "" && !isNaN(Number(v))) return Number(v);
    if (field.key === "high_reach_fee") {
      const ladder = targetSettings.site_preparation?.ladderArrangementFee;
      if (typeof ladder === "number" && !isNaN(ladder)) return ladder;
    }
    return field.fallback;
  }, []);

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
      settings: liveSettings,
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

  const minMarginThreshold = getFieldValue(
    RATE_FIELDS.find(f => f.key === "minimum_margin_threshold")!,
    liveSettings
  );

  const getMarginColor = (margin: number) => {
    if (margin < minMarginThreshold) return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
    if (margin < minMarginThreshold + 10) return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  };

  const handleRateChange = (key: keyof AppSettings, raw: string) => {
    const val = parseFloat(raw);
    const num = isNaN(val) ? 0 : val;
    setLiveSettings(prev => ({
      ...prev,
      [key]: num,
      ...(key === "high_reach_fee" ? {
        site_preparation: {
          ...(prev.site_preparation || {}),
          ladderArrangementFee: num,
        }
      } : {})
    }));
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
      if (res.ok) {
        setSaveStatus("ok");
      } else {
        setSaveStatus("err");
      }
    } catch {
      setSaveStatus("err");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3500);
    }
  };

  const handleReset = () => {
    setLiveSettings(settings);
    setEditMode(false);
  };

  const hasChanges = useMemo(() => {
    return RATE_FIELDS.some(field => {
      const cur = getFieldValue(field, liveSettings);
      const orig = getFieldValue(field, settings);
      return cur !== orig;
    });
  }, [liveSettings, settings, getFieldValue]);

  return (
    <div className="space-y-6">
      {/* ── LIVE RATE EDITOR (COLLAPSIBLE / HIGH DENSITY) ──────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden transition-all">
        {/* Header Strip */}
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Live Rate Parameters
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  16 Active Rates
                </span>
                {hasChanges && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    Unsaved Edits
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 font-medium">
                Adjust core pricing variables. Changes instantly recompute the matrix below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}

            <button
              onClick={() => {
                setIsEditorOpen(prev => !prev);
                if (!isEditorOpen) setEditMode(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                isEditorOpen
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              {isEditorOpen ? (editMode ? "Editing (16)" : "Rates View") : "Edit Rates (16)"}
              {isEditorOpen ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            {isEditorOpen && (
              <button
                onClick={() => setEditMode(v => !v)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  editMode
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                }`}
              >
                <Pencil className="w-3 h-3" /> {editMode ? "Lock Values" : "Unlock Inputs"}
              </button>
            )}

            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
                  saveStatus === "ok"
                    ? "bg-emerald-600 text-white shadow-emerald-600/30"
                    : saveStatus === "err"
                    ? "bg-red-600 text-white shadow-red-600/30"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                } disabled:opacity-60`}
              >
                {saveStatus === "ok" ? (
                  <><CheckCircle2 className="w-3 h-3" /> Saved!</>
                ) : saveStatus === "err" ? (
                  <><AlertTriangle className="w-3 h-3" /> Error</>
                ) : saving ? (
                  "Saving…"
                ) : (
                  <><Save className="w-3 h-3" /> Push to Production</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick-Glance Pill Bar (Visible when collapsed to keep page compact) */}
        {!isEditorOpen ? (
          <div className="px-5 py-3 bg-zinc-50/70 dark:bg-zinc-900/40 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-1">Quick Rates:</span>
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 font-semibold text-zinc-700 dark:text-zinc-200 text-[11px]">
              HD Labor: <strong className="text-zinc-900 dark:text-white">₹{getFieldValue(RATE_FIELDS[0], liveSettings)}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 font-semibold text-zinc-700 dark:text-zinc-200 text-[11px]">
              IP Labor: <strong className="text-zinc-900 dark:text-white">₹{getFieldValue(RATE_FIELDS[1], liveSettings)}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 font-semibold text-zinc-700 dark:text-zinc-200 text-[11px]">
              Cable: <strong className="text-zinc-900 dark:text-white">₹{getFieldValue(RATE_FIELDS[2], liveSettings)}</strong> / <strong className="text-zinc-900 dark:text-white">₹{getFieldValue(RATE_FIELDS[3], liveSettings)}/m</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 font-semibold text-zinc-700 dark:text-zinc-200 text-[11px]">
              High-Reach: <strong className="text-zinc-900 dark:text-white">₹{getFieldValue(RATE_FIELDS[6], liveSettings)}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 font-semibold text-zinc-700 dark:text-zinc-200 text-[11px]">
              GST: <strong className="text-zinc-900 dark:text-white">{getFieldValue(RATE_FIELDS[8], liveSettings)}%</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 font-semibold text-zinc-700 dark:text-zinc-200 text-[11px]">
              Min Margin: <strong className="text-zinc-900 dark:text-white">{minMarginThreshold}%</strong>
            </span>
            <button
              onClick={() => {
                setIsEditorOpen(true);
                setEditMode(true);
              }}
              className="ml-auto text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Expand All 16 Parameters <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        ) : (
          /* Full 16-Field Grid (4x4, complete, zero blanks) */
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50/50 dark:bg-zinc-950/20">
            {RATE_FIELDS.map(field => {
              const val = getFieldValue(field, liveSettings);
              const origVal = getFieldValue(field, settings);
              const changed = val !== origVal;
              return (
                <div
                  key={field.key}
                  className={`space-y-1.5 p-3 rounded-xl transition-all border ${
                    changed
                      ? "bg-blue-50/80 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40 shadow-xs"
                      : "bg-white dark:bg-zinc-800/60 border-zinc-200/80 dark:border-zinc-700/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[9.5px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wider block truncate">
                      {field.label}
                    </label>
                    {changed && <span className="w-2 h-2 rounded-full bg-blue-500" title="Modified" />}
                  </div>

                  <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 select-none">
                      {field.unit}
                    </span>
                    <input
                      type="number"
                      disabled={!editMode}
                      value={val}
                      onChange={e => handleRateChange(field.key, e.target.value)}
                      className={`w-full bg-transparent text-sm font-black text-zinc-900 dark:text-white focus:outline-none transition-all ${
                        editMode ? "cursor-text text-blue-600 dark:text-blue-400" : "cursor-default"
                      }`}
                    />
                  </div>

                  <p className="text-[8.5px] text-zinc-400 dark:text-zinc-500 leading-tight truncate" title={field.description}>
                    {field.description}
                  </p>

                  {changed && (
                    <p className="text-[8.5px] text-blue-600 dark:text-blue-400 font-bold">
                      Default: {field.unit}{origVal}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MATRIX + SIMULATOR (PROMINENTLY DISPLAYED) ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="bg-zinc-50 dark:bg-zinc-900/80 px-4 md:px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" /> Dynamic Quotation Matrix
                </h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                  Full 1–16 camera combinations across equipment tiers
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Price vs Margin Switcher */}
                <div className="flex bg-zinc-200/80 dark:bg-zinc-800 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
                  <button
                    onClick={() => setViewMode("price")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      viewMode === "price"
                        ? "bg-white dark:bg-zinc-700 shadow-xs text-blue-600 dark:text-blue-400"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <DollarSign className="w-3 h-3" /> Price (₹)
                  </button>
                  <button
                    onClick={() => setViewMode("margin")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      viewMode === "margin"
                        ? "bg-white dark:bg-zinc-700 shadow-xs text-blue-600 dark:text-blue-400"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <TrendingUp className="w-3 h-3" /> Margin (%)
                  </button>
                </div>

                {/* Technology Tabs */}
                <div className="flex bg-zinc-200/80 dark:bg-zinc-800 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
                  <button
                    onClick={() => setActiveTab("IP")}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      activeTab === "IP"
                        ? "bg-white dark:bg-zinc-700 shadow-xs text-blue-600 dark:text-blue-400"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    IP Series
                  </button>
                  <button
                    onClick={() => setActiveTab("HD")}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      activeTab === "HD"
                        ? "bg-white dark:bg-zinc-700 shadow-xs text-blue-600 dark:text-blue-400"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    HD Analog
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto p-4 md:p-6">
              <table className="w-full text-left border-separate border-spacing-2">
                <thead className="text-zinc-400 dark:text-zinc-500 uppercase text-[9px] font-black tracking-widest">
                  <tr>
                    <th className="px-2 py-3 text-center">Cameras</th>
                    {activeTab === "IP" ? (
                      <>
                        <th className="px-3 py-3 text-right">Opt 1 (Budget)</th>
                        <th className="px-3 py-3 text-right">Opt 2 (Standard)</th>
                        <th className="px-3 py-3 text-right">Opt 3 (Color)</th>
                        <th className="px-3 py-3 text-right">Opt 4 (Prem. Color)</th>
                        <th className="px-3 py-3 text-right">Opt 5 (High Res)</th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-3 text-right">Opt 1 (Standard)</th>
                        <th className="px-3 py-3 text-right">Opt 2 (Color+)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === "IP" ? ipMatrix : hdMatrix).map((row: any) => (
                    <tr key={row.cameras} className="group">
                      <td className="px-2 py-2.5 text-center font-black text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg text-xs">
                        {row.cameras} {row.cameras === 1 ? "Cam" : "Cams"}
                      </td>
                      {[1, 2, 3, 4, 5].filter(o => row[`opt${o}`]).map(o => {
                        const cell = row[`opt${o}`] as MatrixCell;
                        return (
                          <td
                            key={o}
                            className={`px-3 py-2.5 text-right font-black rounded-lg border transition-all hover:scale-[1.02] cursor-help relative group/cell ${getMarginColor(cell.margin)}`}
                            title={`Gross Profit: ₹${cell.result.gross_profit_value?.toLocaleString("en-IN")}\nPurchase Cost: ₹${cell.result.total_purchase_cost?.toLocaleString("en-IN")}\nClient Price: ₹${cell.total.toLocaleString("en-IN")}`}
                          >
                            <div className="text-[11px] font-bold">
                              {viewMode === "price" ? `₹${cell.total.toLocaleString("en-IN")}` : `${cell.margin}%`}
                            </div>
                            {cell.margin < minMarginThreshold && (
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

            {/* Margin Legend */}
            <div className="px-4 md:px-6 py-3.5 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-[9.5px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
                Target Healthy (&gt;{minMarginThreshold + 10}%)
              </div>
              <div className="flex items-center gap-2 text-[9.5px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
                Moderate Risk ({minMarginThreshold}-{minMarginThreshold + 10}%)
              </div>
              <div className="flex items-center gap-2 text-[9.5px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/40" />
                Below Target Threshold (&lt;{minMarginThreshold}%)
              </div>
            </div>
          </div>
        </div>

        {/* ── SCENARIO SIMULATOR (STICKY COLUMN) ───────────────────────────── */}
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
