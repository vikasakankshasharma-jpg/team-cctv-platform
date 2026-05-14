"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { FranchiseDealer, FranchisePricingOverride, Product } from "@/types";

interface Props {
  dealer: FranchiseDealer & { id: string };
  existingOverride: (FranchisePricingOverride & { id: string }) | null;
  products: (Product & { id: string })[];
}

interface ProductOverrideRow {
  product_id: string;
  purchase_cost: number | "";
  margin_percent: number | "";
  unit_price_override: number | "";
  display_name: string;
  category: string;
  default_cost: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function FranchisePricingClient({ dealer, existingOverride, products }: Props) {
  const router = useRouter();

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
          default_cost:        p.base_cost ?? Math.round(p.unit_price * 0.65),
          purchase_cost:       existing?.purchase_cost ?? "",
          margin_percent:      existing?.margin_percent ?? "",
          unit_price_override: existing?.unit_price_override ?? "",
        };
      })
  );

  const [saving, setSaving] = useState(false);

  const updateRow = (idx: number, key: keyof ProductOverrideRow, val: number | "") => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  };

  const computeSellPrice = (row: ProductOverrideRow): string => {
    if (row.unit_price_override !== "") return `₹${fmt(row.unit_price_override as number)} (locked)`;
    if (row.purchase_cost !== "" && row.margin_percent !== "") {
      const cost   = row.purchase_cost as number;
      const margin = row.margin_percent as number;
      const sell   = Math.round(cost / (1 - margin / 100));
      return `₹${fmt(sell)}`;
    }
    return "—";
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
          .filter((r) => r.purchase_cost !== "" || r.unit_price_override !== "")
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
      toast.success("Pricing override saved successfully");
      router.refresh();
    } catch (err) {
      toast.error("Failed to save pricing override");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const categories = ["camera", "recorder", "accessory"] as const;
  const NAVY = "#0F1F3D";

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/franchises")}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm font-bold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Franchise Network
      </button>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <strong>How pricing overrides work:</strong> Leave any field blank to use TEAM CCTV defaults.
          Fill in <em>Purchase Cost</em> + <em>Margin %</em> to let the engine calculate the sell price,
          or use <em>Price Lock</em> to set an exact sell price regardless of cost.
        </div>
      </div>

      {/* Labor + Guardrails */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[24px] p-6 space-y-5">
        <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">
          Labor & Cabling Costs — {dealer.company_name}
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "IP Labor / Camera (₹)", value: laborIp, set: setLaborIp, placeholder: "Default: 1000" },
            { label: "HD Labor / Camera (₹)", value: laborHd, set: setLaborHd, placeholder: "Default: 800" },
            { label: "Cable / Meter (₹)",     value: cable,   set: setCable,   placeholder: "Default: 45" },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label} className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</label>
              <input
                type="number" min={0}
                value={value}
                onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={placeholder}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Min Margin Floor (%)
            </label>
            <input
              type="number" min={0} max={100} step={0.5}
              value={minMargin}
              onChange={(e) => setMinMargin(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
            />
            <p className="text-[9px] text-zinc-400">Franchise cannot quote below this margin.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Max Discount Allowed (%)</label>
            <input
              type="number" min={0} max={50} step={0.5}
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <p className="text-[9px] text-zinc-400">Maximum discount franchise can offer a customer.</p>
          </div>
        </div>
      </div>

      {/* Product Overrides Table */}
      {categories.map((cat) => {
        const catRows = rows.filter((r) => r.category === cat);
        if (catRows.length === 0) return null;
        return (
          <div key={cat} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[24px] overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">
                {cat === "camera" ? "📷 Cameras" : cat === "recorder" ? "💾 Recorders" : "🔧 Accessories"}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950">
                    {["Product", "Default Cost", "Your Purchase Cost", "Margin %", "Price Lock", "Sell Price"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[9px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {catRows.map((row) => {
                    const globalIdx = rows.findIndex((r) => r.product_id === row.product_id);
                    return (
                      <tr key={row.product_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-xs font-bold text-zinc-900 dark:text-white">{row.display_name}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400 font-medium">₹{fmt(row.default_cost)}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number" min={0}
                            value={row.purchase_cost}
                            onChange={(e) => updateRow(globalIdx, "purchase_cost", e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder={`₹${fmt(row.default_cost)}`}
                            className="w-28 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-xs font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number" min={0} max={100} step={0.5}
                            value={row.margin_percent}
                            onChange={(e) => updateRow(globalIdx, "margin_percent", e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Default"
                            className="w-20 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-xs font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number" min={0}
                            value={row.unit_price_override}
                            onChange={(e) => updateRow(globalIdx, "unit_price_override", e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Optional"
                            className="w-28 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-lg px-2 py-1.5 text-xs font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${row.unit_price_override !== "" ? "text-amber-600" : "text-emerald-600"}`}>
                            {computeSellPrice(row)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Save */}
      <div className="flex gap-3 items-center pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : existingOverride ? "Update Pricing Override" : "Save Pricing Override"}
        </button>
        <p className="text-xs text-zinc-400 font-medium">
          Changes apply to the next quote generated for {dealer.company_name}'s territory.
        </p>
      </div>
    </div>
  );
}
