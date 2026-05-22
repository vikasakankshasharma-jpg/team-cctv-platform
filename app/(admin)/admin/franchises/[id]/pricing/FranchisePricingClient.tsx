"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Info, AlertTriangle, ShieldCheck, Lock, DollarSign, Settings2 } from "lucide-react";
import { toast } from "sonner";
import type { FranchiseDealer, FranchisePricingOverride, Product } from "@/types";

interface Props {
  dealer: FranchiseDealer & { id: string };
  existingOverride: (FranchisePricingOverride & { id: string }) | null;
  products: (Product & { id: string })[];
}

interface ProductOverrideRow {
  product_id: string;
  display_name: string;
  category: string;
  default_cost: number;
  purchase_cost: number | "";
  margin_percent: number | "";
  unit_price_override: number | "";
  brand?: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function FranchisePricingClient({ dealer, existingOverride, products }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"camera" | "recorder" | "accessory" | "global">("camera");

  // Labor overrides
  const [laborIp, setLaborIp]   = useState<number | "">(existingOverride?.labor_ip_per_camera ?? "");
  const [laborHd, setLaborHd]   = useState<number | "">(existingOverride?.labor_hd_per_camera ?? "");
  const [cable, setCable]        = useState<number | "">(existingOverride?.cable_cost_per_meter ?? "");
  const [minMargin, setMinMargin] = useState<number | "">(existingOverride?.minimum_margin_percent ?? 15);
  const [maxDiscount, setMaxDiscount] = useState<number | "">(existingOverride?.maximum_discount_percent ?? 5);

  // Build product override rows from products list
  const [rows, setRows] = useState<ProductOverrideRow[]>(() =>
    products
      .filter((p) => ["camera", "recorder", "accessory"].includes(p.category))
      .map((p) => {
        const existing = existingOverride?.product_overrides?.find((o) => o.product_id === p.id!);
        return {
          product_id:          p.id!,
          display_name:        p.display_name,
          category:            p.category,
          brand:               p.brand,
          default_cost:        p.base_cost ?? Math.round(p.unit_price * 0.65),
          purchase_cost:       existing?.purchase_cost ?? "",
          margin_percent:      existing?.margin_percent ?? "",
          unit_price_override: existing?.unit_price_override ?? "",
        };
      })
  );

  const [saving, setSaving] = useState(false);

  const updateRow = (idx: number, key: keyof ProductOverrideRow, val: any) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  };

  const computeSellPrice = (row: ProductOverrideRow) => {
    if (row.unit_price_override !== "") return { val: row.unit_price_override as number, type: "locked" };
    if (row.purchase_cost !== "" && row.margin_percent !== "") {
      const cost   = row.purchase_cost as number;
      const margin = row.margin_percent as number;
      const sell   = Math.round(cost / (1 - margin / 100));
      return { val: sell, type: "calculated" };
    }
    return null;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        franchise_dealer_id:    dealer.id,
        labor_ip_per_camera:    laborIp   !== "" ? Number(laborIp)   : undefined,
        labor_hd_per_camera:    laborHd   !== "" ? Number(laborHd)   : undefined,
        cable_cost_per_meter:   cable     !== "" ? Number(cable)     : undefined,
        minimum_margin_percent: minMargin !== "" ? Number(minMargin) : 15,
        maximum_discount_percent: maxDiscount !== "" ? Number(maxDiscount) : 5,
        product_overrides: rows
          .filter((r) => r.purchase_cost !== "" || r.unit_price_override !== "" || r.margin_percent !== "")
          .map((r) => ({
            product_id:         r.product_id,
            purchase_cost:      r.purchase_cost !== "" ? Number(r.purchase_cost) : r.default_cost,
            margin_percent:     r.margin_percent !== "" ? Number(r.margin_percent) : undefined,
            unit_price_override: r.unit_price_override !== "" ? Number(r.unit_price_override) : undefined,
          })),
      };

      const res = await fetch(`/api/admin/franchises/${dealer.id}/pricing`, {
        method: existingOverride ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success("Pricing configuration synchronized");
      router.refresh();
    } catch (err) {
      toast.error("Failed to synchronize pricing");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Navigation */}
      <button
        onClick={() => router.push("/admin/franchises")}
        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-950 dark:hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Territory Network
      </button>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 shadow-md shadow-zinc-200/50 dark:shadow-none flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Territory Status</p>
            <p className="text-sm font-black text-zinc-900 dark:text-white uppercase">Exclusivity Active</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 shadow-md shadow-zinc-200/50 dark:shadow-none flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Minimum Margin</p>
            <p className="text-sm font-black text-zinc-900 dark:text-white uppercase">{minMargin}% Floor</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 shadow-md shadow-zinc-200/50 dark:shadow-none flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Custom SKUs</p>
            <p className="text-sm font-black text-zinc-900 dark:text-white uppercase">{rows.filter(r => r.purchase_cost !== "" || r.unit_price_override !== "").length} Overrides</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit border border-zinc-200/50 dark:border-zinc-800">
        {[
          { id: "camera", label: "Cameras", icon: "📷" },
          { id: "recorder", label: "Recorders", icon: "💾" },
          { id: "accessory", label: "Accessories", icon: "🔧" },
          { id: "global", label: "Global Overrides", icon: "⚙️" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md shadow-zinc-200/50 dark:shadow-none"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-md shadow-zinc-200/40 dark:shadow-none overflow-hidden min-h-[400px]">
        {activeTab === "global" ? (
          <div className="p-10 space-y-10">
            <div>
              <h3 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                 <Settings2 className="w-4 h-4 text-blue-500" /> Operational Guardrails
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> Margin Protection Floor (%)
                  </label>
                  <input
                    type="number" min={0} max={100} step={0.5}
                    value={minMargin}
                    onChange={(e) => setMinMargin(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/40 rounded-2xl px-5 py-4 text-sm font-black text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-amber-500/5 transition-all"
                  />
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Prevents franchise from quoting below sustainable levels.</p>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Max Discount Authorization (%)</label>
                  <input
                    type="number" min={0} max={50} step={0.5}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm font-black text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Upper bound for discretionary customer discounts.</p>
                </div>
              </div>
            </div>

            <hr className="border-zinc-50 dark:border-zinc-800" />

            <div>
              <h3 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-[0.2em] mb-8">Installation & Logistic Constants</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: "IP Labor / Camera", value: laborIp, set: setLaborIp, placeholder: "1,000", icon: "🔌" },
                  { label: "HD Labor / Camera", value: laborHd, set: setLaborHd, placeholder: "800", icon: "📼" },
                  { label: "Cabling / Meter",    value: cable,   set: setCable,   placeholder: "45", icon: "🧶" },
                ].map(({ label, value, set, placeholder, icon }) => (
                  <div key={label} className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label} (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-30">{icon}</span>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder={placeholder}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-12 py-4 text-sm font-black text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Hardware Identifier</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">TEAM Default</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Local Cost (₹)</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Target Margin (%)</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Price Lock (₹)</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Output Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                {rows
                  .filter((r) => r.category === activeTab)
                  .map((row) => {
                    const globalIdx = rows.findIndex((r) => r.product_id === row.product_id);
                    const sell = computeSellPrice(row);
                    const isOverridden = row.purchase_cost !== "" || row.unit_price_override !== "" || row.margin_percent !== "";

                    return (
                      <tr key={row.product_id} className={`group transition-colors ${isOverridden ? "bg-blue-50/20 dark:bg-blue-500/5" : "hover:bg-zinc-50/50 dark:hover:bg-white"}`}>
                        <td className="px-8 py-6">
                          <p className="text-[11px] font-black text-zinc-950 dark:text-white uppercase tracking-tight mb-1">{row.display_name}</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{row.brand || "Standard"}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[11px] font-bold text-zinc-400">₹{fmt(row.default_cost)}</span>
                        </td>
                        <td className="px-8 py-6">
                          <input
                            type="number"
                            value={row.purchase_cost}
                            onChange={(e) => updateRow(globalIdx, "purchase_cost", e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder={fmt(row.default_cost)}
                            className="w-28 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-black text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                          />
                        </td>
                        <td className="px-8 py-6">
                          <input
                            type="number"
                            value={row.margin_percent}
                            onChange={(e) => updateRow(globalIdx, "margin_percent", e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="System"
                            className="w-24 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-black text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                          />
                        </td>
                        <td className="px-8 py-6">
                          <input
                            type="number"
                            value={row.unit_price_override}
                            onChange={(e) => updateRow(globalIdx, "unit_price_override", e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Manual"
                            className="w-28 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/40 rounded-xl px-4 py-2.5 text-xs font-black text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-amber-500/5 transition-all"
                          />
                        </td>
                        <td className="px-8 py-6 text-right">
                          {sell ? (
                            <div className="flex flex-col items-end">
                              <span className={`text-[13px] font-black ${sell.type === "locked" ? "text-amber-600" : "text-emerald-600"}`}>
                                ₹{fmt(sell.val)}
                              </span>
                              <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{sell.type === "locked" ? "Override" : "Simulated"}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Global Default</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-10 py-5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl shadow-md shadow-black/40 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Franchise Sync</span>
          <span className="text-xs font-bold whitespace-nowrap">{dealer.company_name} · {rows.filter(r => r.purchase_cost !== "" || r.unit_price_override !== "").length} Changes Pending</span>
        </div>
        <div className="w-px h-8 bg-white dark:bg-black mx-2" />
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 px-8 py-3 bg-blue-600 dark:bg-zinc-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Synchronizing..." : "Commit Pricing Changes"}
        </button>
      </div>

      {/* Helper Info */}
      <div className="flex justify-center mt-10">
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40 text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">
           <Info className="w-4 h-4" /> Changes apply instantly to all new quotations in this territory.
        </div>
      </div>
    </div>
  );
}
