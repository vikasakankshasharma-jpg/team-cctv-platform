"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronRight, Edit2, Camera, Monitor, Layers, Zap, Package } from "lucide-react";
import type { Product } from "@/types";

// ─── Config ────────────────────────────────────────────────────────────────

const CATEGORIES = {
  camera:    { label: "Cameras",                icon: Camera,  accent: "blue"   },
  recorder:  { label: "Recorders (DVR / NVR)",  icon: Monitor, accent: "amber"  },
  accessory: { label: "Accessories & Cables",   icon: Layers,  accent: "teal"   },
} as const;

const ACCENT: Record<string, string> = {
  blue:  "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20",
  amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
  teal:  "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20",
};

const TECH_PILL: Record<string, string> = {
  IP:   "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  HD:   "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  both: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
};

function sellingPrice(p: Product): number {
  if (p.base_cost !== undefined && p.margin_percentage !== undefined) {
    return Math.round(p.base_cost + p.base_cost * (p.margin_percentage / 100));
  }
  return p.unit_price ?? 0;
}

// ─── Stat Chip ─────────────────────────────────────────────────────────────

function Chip({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-black text-zinc-900 dark:text-white">{value}</span>
    </div>
  );
}

// ─── Category Section ──────────────────────────────────────────────────────

function CategorySection({
  categoryKey,
  products,
  onEdit,
  onToggle,
}: {
  categoryKey: keyof typeof CATEGORIES;
  products: Product[];
  onEdit: (p: Product) => void;
  onToggle: (p: Product) => void;
}) {
  const [open, setOpen] = useState(true);
  const cfg = CATEGORIES[categoryKey];
  const Icon = cfg.icon;
  const acc = ACCENT[cfg.accent];
  const isCamera = categoryKey === "camera";
  const isRecorder = categoryKey === "recorder";

  if (products.length === 0) return null;

  return (
    <div className="rounded-[24px] border border-zinc-100 dark:border-zinc-800/60 overflow-hidden shadow-md dark:shadow-xl bg-white dark:bg-zinc-900/40">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-5 py-3.5 border-b ${acc} transition-opacity hover:opacity-90`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center border ${acc}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{cfg.label}</span>
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/60 dark:bg-zinc-950/40 border border-current/20">
            {products.length}
          </span>
        </div>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Table */}
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50/80 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800/60">
              <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                <th className="px-5 py-3">Product / SKU</th>
                <th className="px-5 py-3">Brand</th>
                {isCamera   && <th className="px-5 py-3">Resolution</th>}
                {isRecorder && <th className="px-5 py-3">Channels</th>}
                <th className="px-5 py-3">Tech</th>
                <th className="px-5 py-3 text-right">Base Cost</th>
                <th className="px-5 py-3 text-right">Margin</th>
                <th className="px-5 py-3 text-right">Sell Price</th>
                <th className="px-5 py-3 text-center">Stock</th>
                <th className="px-5 py-3 text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/20 transition-all group/row ${!p.is_active ? "opacity-40" : ""}`}
                >
                  {/* Name + SKU */}
                  <td className="px-5 py-3.5">
                    <div className="font-black text-sm text-zinc-900 dark:text-white group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors leading-tight">
                      {p.display_name}
                    </div>
                    {p.technical_name && (
                      <code className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mt-0.5 block">
                        {p.technical_name}
                      </code>
                    )}
                  </td>

                  {/* Brand */}
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      {p.brand || <span className="text-zinc-300 dark:text-zinc-700">—</span>}
                    </span>
                  </td>

                  {/* Resolution (cameras) */}
                  {isCamera && (
                    <td className="px-5 py-3.5">
                      {(p as any).resolution_mp ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg text-[9px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">
                          <Zap className="w-2.5 h-2.5" />
                          {(p as any).resolution_mp}MP
                        </span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700 text-[9px]">—</span>
                      )}
                    </td>
                  )}

                  {/* Channels (recorders) */}
                  {isRecorder && (
                    <td className="px-5 py-3.5">
                      {p.channels ? (
                        <span className="inline-flex px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                          {p.channels}CH
                        </span>
                      ) : (p.max_cameras ? (
                        <span className="inline-flex px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg text-[9px] font-black text-amber-700 dark:text-amber-400">
                          ≤{p.max_cameras}CH
                        </span>
                      ) : <span className="text-zinc-300 dark:text-zinc-700 text-[9px]">—</span>)}
                    </td>
                  )}

                  {/* Technology */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${TECH_PILL[p.technology] || TECH_PILL.HD}`}>
                      {p.technology}
                    </span>
                  </td>

                  {/* Base Cost */}
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                      {(p as any).base_cost !== undefined
                        ? `₹${Number((p as any).base_cost).toLocaleString("en-IN")}`
                        : <span className="text-zinc-200 dark:text-zinc-800">—</span>}
                    </span>
                  </td>

                  {/* Margin */}
                  <td className="px-5 py-3.5 text-right">
                    {(p as any).margin_percentage !== undefined ? (
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500">
                        +{(p as any).margin_percentage}%
                      </span>
                    ) : <span className="text-zinc-200 dark:text-zinc-800 text-[9px]">—</span>}
                  </td>

                  {/* Selling Price */}
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-sm font-black text-zinc-900 dark:text-white">
                      ₹{sellingPrice(p).toLocaleString("en-IN")}
                    </span>
                  </td>

                  {/* Stock Toggle */}
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => onToggle(p)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        p.is_active
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100"
                          : "bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-emerald-500 animate-pulse" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                      {p.is_active ? "In Stock" : "Off"}
                    </button>
                  </td>

                  {/* Edit */}
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => onEdit(p)}
                      className="w-8 h-8 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-500/40 flex items-center justify-center mx-auto transition-all active:scale-90"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────

interface ProductInventoryProps {
  products: Product[];
  onEdit: (p: Product) => void;
  onToggle: (p: Product) => void;
}

export function ProductInventory({ products, onEdit, onToggle }: ProductInventoryProps) {
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState<string>("all");
  const [filterTech, setFilterTech] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.display_name.toLowerCase().includes(q) ||
        p.technical_name?.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q);
      const matchCat    = filterCat === "all"    || p.category === filterCat;
      const matchTech   = filterTech === "all"   || p.technology === filterTech;
      const matchStatus = filterStatus === "all" || (filterStatus === "active" ? p.is_active : !p.is_active);
      return matchSearch && matchCat && matchTech && matchStatus;
    });
  }, [products, search, filterCat, filterTech, filterStatus]);

  const counts = useMemo(() => ({
    camera:    filtered.filter((p) => p.category === "camera").length,
    recorder:  filtered.filter((p) => p.category === "recorder").length,
    accessory: filtered.filter((p) => p.category === "accessory").length,
    active:    products.filter((p) => p.is_active).length,
    total:     products.length,
  }), [filtered, products]);

  const SEL = "bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer";

  return (
    <div className="space-y-6">

      {/* ── Stats bar ── */}
      <div className="flex flex-wrap gap-2">
        <Chip label="Total SKUs"  value={counts.total}     dot="bg-zinc-400" />
        <Chip label="Cameras"     value={counts.camera}    dot="bg-blue-500" />
        <Chip label="Recorders"   value={counts.recorder}  dot="bg-amber-500" />
        <Chip label="Accessories" value={counts.accessory} dot="bg-teal-500" />
        <Chip label="Active"      value={counts.active}    dot="bg-emerald-500" />
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search name, SKU, brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-zinc-400 dark:placeholder-zinc-700"
          />
        </div>

        {/* Category filter */}
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className={SEL}>
          <option value="all">All Types</option>
          <option value="camera">Camera</option>
          <option value="recorder">Recorder</option>
          <option value="accessory">Accessory</option>
        </select>

        {/* Technology filter */}
        <select value={filterTech} onChange={(e) => setFilterTech(e.target.value)} className={SEL}>
          <option value="all">All Tech</option>
          <option value="IP">IP</option>
          <option value="HD">HD</option>
          <option value="both">Both</option>
        </select>

        {/* Status filter */}
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={SEL}>
          <option value="all">All Status</option>
          <option value="active">In Stock</option>
          <option value="inactive">Off</option>
        </select>
      </div>

      {/* ── Category groups ── */}
      <div className="space-y-4">
        {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map((cat) => (
          <CategorySection
            key={cat}
            categoryKey={cat}
            products={filtered.filter((p) => p.category === cat)}
            onEdit={onEdit}
            onToggle={onToggle}
          />
        ))}
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-24 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[24px]">
          <div className="w-14 h-14 rounded-[20px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
            <Package className="w-7 h-7 text-zinc-300 dark:text-zinc-700" />
          </div>
          <p className="text-xs font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
            No products match your filters
          </p>
        </div>
      )}
    </div>
  );
}
