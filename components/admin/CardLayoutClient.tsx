"use client";

import { useState } from "react";
import { Plus, Trash2, Save, Eye, EyeOff, GripVertical, Monitor, Camera, Network, Zap, ChevronDown, ChevronUp } from "lucide-react";
import type { CardLayoutRule, CardSlot, Product } from "@/types";
import { toast } from "sonner";

const PROPERTY_TYPES = ["home", "bungalow", "office", "shop", "warehouse", "society"];

const emptySlot = (slot: CardSlot["slot"]): CardSlot => ({
  slot,
  technology: "IP",
  camera_option: slot === "budget" ? 1 : slot === "recommended" ? 2 : 3,
  badge: undefined,
  is_featured: slot === "recommended",
});

const emptyLayout = (): Omit<CardLayoutRule, "id"> => ({
  name: "",
  description: "",
  technology_filter: "any",
  property_type_filter: [],
  camera_count_min: undefined,
  camera_count_max: undefined,
  priority: 10,
  is_active: true,
  cards: [emptySlot("budget"), emptySlot("recommended"), emptySlot("premium")],
});

// ─── Mini card preview ────────────────────────────────────────────────────────
function SlotPreview({ slot, cameras }: { slot: CardSlot; cameras: Product[] }) {
  const cam = cameras.find(
    (c) => c.technical_name === `cam_${slot.technology.toLowerCase()}_opt${slot.camera_option}`
  );
  const isIP = slot.technology === "IP";
  const badgeColor =
    slot.slot === "recommended"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : slot.badge === "Smart Upgrade"
      ? "bg-indigo-100 text-indigo-700 border-indigo-200"
      : "bg-zinc-100 text-zinc-500 border-zinc-200";

  return (
    <div className={`relative flex-1 p-3 rounded-2xl border-2 text-center ${slot.is_featured ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"}`}>
      {slot.is_featured && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-black bg-amber-400 text-white px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">⭐ Recommended</div>
      )}
      {slot.badge && !slot.is_featured && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">{slot.badge}</div>
      )}
      <div className={`text-[8px] font-black uppercase tracking-widest mb-1 ${slot.slot === "recommended" ? "text-amber-600" : "text-zinc-400"}`}>
        {slot.slot}
      </div>
      <div className={`inline-flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded-full border mb-2 ${isIP ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
        {isIP ? <Network className="w-2 h-2" /> : <Camera className="w-2 h-2" />}
        {slot.technology} · {isIP ? "NVR" : "DVR"}
      </div>
      <div className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 leading-tight">
        {cam?.display_name || `${slot.technology} Opt ${slot.camera_option}`}
      </div>
    </div>
  );
}

// ─── Slot editor ──────────────────────────────────────────────────────────────
function SlotEditor({
  slot, cameras, onChange,
}: {
  slot: CardSlot;
  cameras: Product[];
  onChange: (s: CardSlot) => void;
}) {
  const camOptions = cameras
    .filter((c) => c.technology === slot.technology || c.technology === "Common")
    .sort((a, b) => a.unit_price - b.unit_price);

  return (
    <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-zinc-300" />
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${slot.slot === "recommended" ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-500"}`}>
          {slot.slot}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Technology */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Technology</label>
          <select
            value={slot.technology}
            onChange={(e) => onChange({ ...slot, technology: e.target.value as "HD" | "IP", camera_option: 1 })}
            className="w-full text-xs font-bold bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="IP">IP (NVR · Cat6)</option>
            <option value="HD">HD (DVR · Coaxial)</option>
          </select>
        </div>

        {/* Camera Option */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Camera</label>
          <select
            value={slot.camera_option}
            onChange={(e) => onChange({ ...slot, camera_option: parseInt(e.target.value) })}
            className="w-full text-xs font-bold bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {camOptions.map((cam, i) => {
              const optNum = parseInt(cam.technical_name?.match(/opt(\d+)/)?.[1] ?? String(i + 1));
              return (
                <option key={cam.id} value={optNum}>
                  {cam.display_name} — ₹{cam.unit_price.toLocaleString("en-IN")}
                </option>
              );
            })}
            {camOptions.length === 0 && [1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>Option {n}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Badge */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Badge (optional)</label>
          <input
            type="text"
            placeholder="e.g. Smart Upgrade"
            value={slot.badge || ""}
            onChange={(e) => onChange({ ...slot, badge: e.target.value || undefined })}
            className="w-full text-xs font-bold bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Featured */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Show as Recommended</label>
          <button
            type="button"
            onClick={() => onChange({ ...slot, is_featured: !slot.is_featured })}
            className={`w-full text-xs font-black uppercase tracking-wider px-3 py-2 rounded-xl border transition-all ${slot.is_featured ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500"}`}
          >
            {slot.is_featured ? "⭐ Yes" : "No"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Layout row ───────────────────────────────────────────────────────────────
function LayoutRow({ layout, cameras, onSave, onDelete }: {
  layout: CardLayoutRule;
  cameras: Product[];
  onSave: (l: CardLayoutRule) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState({ ...layout });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/card-layouts/${layout.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      onSave({ ...editing, id: layout.id });
      toast.success("Layout saved");
    } catch {
      toast.error("Failed to save layout");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    const next = { ...editing, is_active: !editing.is_active };
    setEditing(next);
    await fetch(`/api/admin/card-layouts/${layout.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    onSave({ ...next, id: layout.id });
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 border rounded-[24px] overflow-hidden transition-all ${editing.is_active ? "border-zinc-100 dark:border-zinc-800" : "border-zinc-200 dark:border-zinc-800 opacity-60"}`}>
      {/* Header row */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-500">
          {editing.priority}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-zinc-900 dark:text-white truncate">{editing.name || "Unnamed Layout"}</div>
          <div className="text-[10px] font-medium text-zinc-400 mt-0.5 flex items-center gap-2 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase ${editing.technology_filter === "IP" ? "bg-blue-50 text-blue-600" : editing.technology_filter === "HD" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-500"}`}>
              {editing.technology_filter === "any" ? "Any Technology" : editing.technology_filter}
            </span>
            {editing.property_type_filter && editing.property_type_filter.length > 0 && (
              <span>{editing.property_type_filter.join(", ")}</span>
            )}
            {(editing.camera_count_min || editing.camera_count_max) && (
              <span>{editing.camera_count_min ?? 1}–{editing.camera_count_max ?? 16} cameras</span>
            )}
          </div>
        </div>

        {/* Card preview strip */}
        <div className="hidden md:flex gap-1.5 flex-1 max-w-xs">
          {editing.cards.map((s) => (
            <SlotPreview key={s.slot} slot={s} cameras={cameras} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={toggleActive} title={editing.is_active ? "Deactivate" : "Activate"}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${editing.is_active ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}>
            {editing.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => { if (confirm("Delete this layout?")) onDelete(layout.id!); }}
            className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800 pt-5 space-y-6 animate-in fade-in duration-200">
          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Layout Name</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full text-sm font-bold bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. IP Home Standard" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Priority</label>
              <input type="number" min="1" max="100" value={editing.priority}
                onChange={(e) => setEditing({ ...editing, priority: parseInt(e.target.value) || 1 })}
                className="w-full text-sm font-bold bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              <p className="text-[9px] text-zinc-400">Lower = checked first</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Technology Filter</label>
              <select value={editing.technology_filter}
                onChange={(e) => setEditing({ ...editing, technology_filter: e.target.value as CardLayoutRule["technology_filter"] })}
                className="w-full text-sm font-bold bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="any">Any (HD or IP)</option>
                <option value="IP">IP only</option>
                <option value="HD">HD only</option>
              </select>
            </div>
          </div>

          {/* Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Property Types</label>
              <div className="flex flex-wrap gap-1.5">
                {PROPERTY_TYPES.map((pt) => {
                  const active = editing.property_type_filter?.includes(pt);
                  return (
                    <button key={pt} type="button"
                      onClick={() => {
                        const cur = editing.property_type_filter || [];
                        setEditing({ ...editing, property_type_filter: active ? cur.filter(x => x !== pt) : [...cur, pt] });
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${active ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"}`}>
                      {pt}
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-zinc-400">Leave empty = match all property types</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Camera Count Min</label>
              <input type="number" min="1" max="16" placeholder="Any"
                value={editing.camera_count_min ?? ""}
                onChange={(e) => setEditing({ ...editing, camera_count_min: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full text-sm font-bold bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Camera Count Max</label>
              <input type="number" min="1" max="16" placeholder="Any"
                value={editing.camera_count_max ?? ""}
                onChange={(e) => setEditing({ ...editing, camera_count_max: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full text-sm font-bold bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>

          {/* Card slots */}
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">3 Card Slots</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {editing.cards.map((slot, i) => (
                <SlotEditor key={slot.slot} slot={slot} cameras={cameras}
                  onChange={(updated) => {
                    const cards = [...editing.cards] as [CardSlot, CardSlot, CardSlot];
                    cards[i] = updated;
                    setEditing({ ...editing, cards });
                  }} />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Live Preview</p>
            <div className="flex gap-3">
              {editing.cards.map((s) => (
                <SlotPreview key={s.slot} slot={s} cameras={cameras} />
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50 shadow-xl">
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Layout"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────
export function CardLayoutClient({ initialLayouts, cameras }: {
  initialLayouts: CardLayoutRule[];
  cameras: Product[];
}) {
  const [layouts, setLayouts] = useState<CardLayoutRule[]>(initialLayouts);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload = emptyLayout();
      const res = await fetch("/api/admin/card-layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Create failed");
      const { id } = await res.json();
      setLayouts([...layouts, { ...payload, id }]);
      toast.success("Layout created — expand to configure");
    } catch {
      toast.error("Failed to create layout");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/card-layouts/${id}`, { method: "DELETE" });
      setLayouts(layouts.filter((l) => l.id !== id));
      toast.success("Layout deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl">
        <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <strong>How it works:</strong> Layouts are checked top-to-bottom by priority. The first layout whose conditions match the customer&apos;s context (technology, property type, camera count) determines which 3 cards they see. If none match, smart defaults apply.
        </div>
      </div>

      {/* Create button */}
      <div className="flex justify-end">
        <button onClick={handleCreate} disabled={creating}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl disabled:opacity-50">
          <Plus className="w-4 h-4" />
          {creating ? "Creating…" : "New Layout"}
        </button>
      </div>

      {/* Layout list */}
      {layouts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[24px]">
          <Monitor className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-sm font-black text-zinc-400 uppercase tracking-wide">No Layouts Configured</p>
          <p className="text-xs text-zinc-400 mt-1 mb-6">Smart defaults apply — create a layout to take full control</p>
          <button onClick={handleCreate} className="px-5 py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-all">
            Create First Layout
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {layouts
            .sort((a, b) => a.priority - b.priority)
            .map((layout) => (
              <LayoutRow key={layout.id} layout={layout} cameras={cameras}
                onSave={(updated) => setLayouts(layouts.map((l) => l.id === updated.id ? updated : l))}
                onDelete={handleDelete} />
            ))}
        </div>
      )}
    </div>
  );
}
