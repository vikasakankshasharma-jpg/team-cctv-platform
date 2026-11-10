"use client";

import { useState } from "react";
import type { GeoPricingRule } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Pencil, Trash2, X, Check, MapPin, Sparkles, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface GeoRulesClientProps {
  data: GeoPricingRule[];
}

export function GeoRulesClient({ data }: GeoRulesClientProps) {
  const [rules, setRules] = useState<GeoPricingRule[]>(data || []);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<GeoPricingRule | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    level: "pincode" | "city" | "state" | "surge";
    target_value: string;
    priority: number;
    labor_multiplier: number;
    flat_travel_fee: number;
    is_active: boolean;
  }>({
    level: "pincode",
    target_value: "",
    priority: 10,
    labor_multiplier: 1.0,
    flat_travel_fee: 0,
    is_active: true,
  });

  const openCreateModal = () => {
    setEditingRule(null);
    setFormData({
      level: "pincode",
      target_value: "",
      priority: (rules.length > 0 ? Math.max(...rules.map(r => r.priority || 0)) + 10 : 10),
      labor_multiplier: 1.0,
      flat_travel_fee: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rule: GeoPricingRule) => {
    setEditingRule(rule);
    setFormData({
      level: (rule.level as any) || "pincode",
      target_value: rule.target_value || "",
      priority: rule.priority || 10,
      labor_multiplier: rule.labor_multiplier || 1.0,
      flat_travel_fee: rule.flat_travel_fee || 0,
      is_active: rule.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.target_value.trim()) {
      toast.error("Please enter a target value (e.g., 302001 or Jaipur)");
      return;
    }

    setSaving(true);
    try {
      if (editingRule?.id) {
        // Update existing rule
        const res = await fetch(`/api/admin/geo-rules/${editingRule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Failed to update rule");

        setRules(prev => prev.map(r => r.id === editingRule.id ? { ...r, ...formData } : r));
        toast.success(`Geo-rule for ${formData.target_value} updated`);
      } else {
        // Create new rule
        const res = await fetch("/api/admin/geo-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Failed to create rule");
        const created = await res.json();

        setRules(prev => [...prev, created].sort((a, b) => (a.priority || 0) - (b.priority || 0)));
        toast.success(`Geo-rule for ${formData.target_value} created`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save geo-rule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule: GeoPricingRule) => {
    if (!window.confirm(`Delete pricing rule for ${rule.target_value}?`)) return;
    try {
      const res = await fetch(`/api/admin/geo-rules/${rule.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete rule");
      setRules(prev => prev.filter(r => r.id !== rule.id));
      toast.success(`Deleted rule for ${rule.target_value}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleSeedDefaults = async () => {
    const defaults = [
      { level: "pincode", target_value: "302001", priority: 10, labor_multiplier: 1.0, flat_travel_fee: 0, is_active: true },
      { level: "pincode", target_value: "302015", priority: 15, labor_multiplier: 1.0, flat_travel_fee: 100, is_active: true },
      { level: "city", target_value: "Jaipur", priority: 50, labor_multiplier: 1.0, flat_travel_fee: 0, is_active: true },
      { level: "state", target_value: "Rajasthan", priority: 100, labor_multiplier: 1.1, flat_travel_fee: 250, is_active: true },
    ];
    setSaving(true);
    try {
      for (const d of defaults) {
        await fetch("/api/admin/geo-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d),
        });
      }
      const refetch = await fetch("/api/admin/geo-rules").then(r => r.json());
      if (Array.isArray(refetch)) setRules(refetch);
      toast.success("Seeded default Rajasthan & Jaipur geo-pricing rules");
    } catch {
      toast.error("Failed to seed default rules");
    } finally {
      setSaving(false);
    }
  };

  const filtered = rules.filter(r =>
    (r.target_value || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.level || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── ACTION BAR ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search by pincode, city, or level..."
            className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {rules.length === 0 && (
            <Button
              onClick={handleSeedDefaults}
              variant="outline"
              disabled={saving}
              className="gap-1.5 text-xs font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Seed Core Rules
            </Button>
          )}
          <Button
            onClick={openCreateModal}
            className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            New Pricing Rule
          </Button>
        </div>
      </div>

      {/* ── RULES TABLE ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-800/60">
              <TableRow className="border-zinc-100 dark:border-zinc-800">
                <TableHead className="w-20 text-center text-[10px] font-black uppercase tracking-wider">Priority</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider">Level</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider">Target Value</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider">Labor Mult.</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider">Travel / Mobilization</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-zinc-400">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm text-zinc-600 dark:text-zinc-300">No geo-pricing rules configured</p>
                    <p className="text-xs text-zinc-400 mt-1">Default state/city labor rates apply everywhere until specific rules are set.</p>
                    <Button onClick={openCreateModal} variant="outline" size="sm" className="mt-4 gap-1.5 text-xs">
                      <PlusCircle className="w-3.5 h-3.5" /> Add First Rule
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((rule) => (
                  <TableRow key={rule.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                    <TableCell className="text-center font-mono font-bold text-xs">
                      #{rule.priority}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${
                        rule.level === "surge" ? "border-rose-500/50 text-rose-600 dark:text-rose-400 bg-rose-500/10" :
                        rule.level === "pincode" ? "border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10" :
                        rule.level === "city" ? "border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-500/10" :
                        "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                      }`}>
                        {rule.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black text-zinc-900 dark:text-white text-sm">
                      {rule.target_value}
                    </TableCell>
                    <TableCell className="font-semibold text-xs">
                      {rule.labor_multiplier && rule.labor_multiplier !== 1.0 ? (
                        <span className={rule.labor_multiplier > 1.0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                          {rule.labor_multiplier}x
                        </span>
                      ) : (
                        <span className="text-zinc-400">1.0x (Standard)</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {rule.flat_travel_fee ? (
                        <span className="text-zinc-700 dark:text-zinc-300 font-bold">+₹{rule.flat_travel_fee}</span>
                      ) : (
                        <span className="text-zinc-400">₹0 (Free)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rule.is_active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rule.is_active ? "bg-emerald-500" : "bg-zinc-400"}`} />
                        {rule.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(rule)}
                          className="h-8 w-8 p-0 text-zinc-500 hover:text-blue-600"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rule)}
                          className="h-8 w-8 p-0 text-zinc-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── CREATE / EDIT MODAL ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-white">
                  {editingRule ? "Edit Geo-Pricing Rule" : "Create New Pricing Rule"}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Configure localized surcharge, multiplier, or travel mobilization.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1.5">
                    Rule Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as any }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-white"
                  >
                    <option value="pincode">Pincode (6-digit)</option>
                    <option value="city">City</option>
                    <option value="state">State</option>
                    <option value="surge">Surge / Festival Rule</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1.5">
                    Priority (Lower runs first)
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 10 }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1.5">
                  Target Value (Pincode / City / State name)
                </label>
                <input
                  type="text"
                  placeholder={formData.level === "pincode" ? "e.g., 302001" : "e.g., Jaipur"}
                  value={formData.target_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1.5">
                    Labor Multiplier (1.0 = base)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="5.0"
                    value={formData.labor_multiplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, labor_multiplier: parseFloat(e.target.value) || 1.0 }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1.5">
                    Flat Travel Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.flat_travel_fee}
                    onChange={(e) => setFormData(prev => ({ ...prev, flat_travel_fee: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="geo-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="geo-active" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Rule is active and evaluated in quotes
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  {saving ? "Saving…" : editingRule ? "Update Rule" : "Create Rule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
