"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowLeft, Save, Plus, X, MapPin, IndianRupee } from "lucide-react";

interface FormData {
  company_name: string;
  owner_name: string;
  mobile_number: string;
  email: string;
  franchise_fee_monthly: number;
  commission_percent: number;
  territory_exclusivity: boolean;
  assigned_pincodes: string;   // comma-separated string in form
  assigned_cities: string;
  assigned_states: string;
  is_active: boolean;
}

const INITIAL: FormData = {
  company_name: "",
  owner_name: "",
  mobile_number: "",
  email: "",
  franchise_fee_monthly: 5000,
  commission_percent: 6,
  territory_exclusivity: true,
  assigned_pincodes: "",
  assigned_cities: "",
  assigned_states: "",
  is_active: true,
};

export function NewFranchiseClient() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof FormData, value: FormData[keyof FormData]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.company_name.trim()) { setError("Company name is required."); return; }
    if (!form.owner_name.trim())   { setError("Owner name is required."); return; }
    if (!form.mobile_number.trim() || form.mobile_number.length < 10) {
      setError("Valid 10-digit mobile number is required."); return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/franchises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          assigned_pincodes: form.assigned_pincodes
            .split(",").map((p) => p.trim()).filter(Boolean),
          assigned_cities: form.assigned_cities
            .split(",").map((c) => c.trim()).filter(Boolean),
          assigned_states: form.assigned_states
            .split(",").map((s) => s.trim()).filter(Boolean),
          // Performance counters — start at zero
          total_leads_received: 0,
          total_leads_won: 0,
          total_ex_tax_business: 0,
          total_commission_due: 0,
          total_commission_paid: 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create franchise dealer");
      }

      const { id } = await res.json();
      router.push(`/admin/franchises/${id}/pricing`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back nav */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm font-bold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Franchise Network
      </button>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[28px] p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">New Franchise Dealer</h2>
            <p className="text-sm text-zinc-400 font-medium">Assign territory and set franchise terms</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Info */}
          <fieldset className="space-y-4">
            <legend className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Business Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Company Name *</label>
                <input
                  value={form.company_name}
                  onChange={(e) => set("company_name", e.target.value)}
                  placeholder="e.g., Sharma CCTV Dealers"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Owner / Contact Person *</label>
                <input
                  value={form.owner_name}
                  onChange={(e) => set("owner_name", e.target.value)}
                  placeholder="e.g., Rahul Sharma"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Mobile Number (OTP Login) *</label>
                <input
                  value={form.mobile_number}
                  onChange={(e) => set("mobile_number", e.target.value)}
                  placeholder="10-digit mobile"
                  maxLength={10}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email (Optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="dealer@example.com"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </fieldset>

          {/* Financial Terms */}
          <fieldset className="space-y-4">
            <legend className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <IndianRupee className="w-3.5 h-3.5" /> Franchise Terms
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Monthly Fee (₹)</label>
                <input
                  type="number" min={0}
                  value={form.franchise_fee_monthly}
                  onChange={(e) => set("franchise_fee_monthly", Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Commission % (of ex-GST sale)</label>
                <input
                  type="number" min={0} max={50} step={0.5}
                  value={form.commission_percent}
                  onChange={(e) => set("commission_percent", Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <p className="text-[9px] text-zinc-400">e.g., 6% on ₹25,000 sale = ₹1,500 commission</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => set("territory_exclusivity", !form.territory_exclusivity)}
                className={`w-10 h-6 rounded-full transition-all relative ${form.territory_exclusivity ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-700"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.territory_exclusivity ? "translate-x-5" : "translate-x-1"}`} />
              </button>
              <div>
                <p className="text-sm font-black text-zinc-900 dark:text-white">Exclusive Territory</p>
                <p className="text-[10px] text-zinc-400">No other franchise dealer can receive leads from their assigned pincodes.</p>
              </div>
            </div>
          </fieldset>

          {/* Territory */}
          <fieldset className="space-y-4">
            <legend className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Territory Assignment
            </legend>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pincodes (comma-separated, highest priority)</label>
              <input
                value={form.assigned_pincodes}
                onChange={(e) => set("assigned_pincodes", e.target.value)}
                placeholder="302001, 302002, 302017, 302020"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <p className="text-[9px] text-zinc-400">Leads from these exact pincodes will auto-route to this dealer.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cities (fallback)</label>
                <input
                  value={form.assigned_cities}
                  onChange={(e) => set("assigned_cities", e.target.value)}
                  placeholder="Jaipur, Ajmer"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">States (broadest fallback)</label>
                <input
                  value={form.assigned_states}
                  onChange={(e) => set("assigned_states", e.target.value)}
                  placeholder="Rajasthan"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </fieldset>

          {/* Status */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("is_active", !form.is_active)}
              className={`w-10 h-6 rounded-full transition-all relative ${form.is_active ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-1"}`} />
            </button>
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              {form.is_active ? "Active — will receive leads immediately" : "Inactive — no leads will be routed"}
            </span>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Creating..." : "Create & Set Pricing →"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
