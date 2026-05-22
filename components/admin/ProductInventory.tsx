import { useState, useMemo, useEffect } from "react";
import { 
  Search, ChevronDown, ChevronRight, Edit2, Camera, Monitor, 
  Layers, Zap, Package, HardDrive, Cpu, Radio, ShieldCheck,
  LayoutGrid, ListFilter, Trash2, Filter
} from "lucide-react";
import type { Product } from "@/types";

// ─── Config ────────────────────────────────────────────────────────────────

const CATEGORIES: Record<string, { label: string; icon: any; accent: string }> = {
  camera:    { label: "Cameras",                icon: Camera,    accent: "blue"   },
  recorder:  { label: "Recorders (DVR / NVR)",  icon: Monitor,   accent: "amber"  },
  accessory: { label: "Accessories",            icon: Layers,    accent: "teal"   },
  cable:     { label: "Cables & Wiring",        icon: Zap,       accent: "indigo" },
  storage:   { label: "Storage (HDD/SD)",       icon: HardDrive, accent: "rose"   },
  network:   { label: "Network (PoE/Switch)",   icon: Cpu,       accent: "violet" },
  power:     { label: "Power & PSU",            icon: Zap,       accent: "yellow" },
  display:   { label: "Display / Monitors",     icon: Monitor,   accent: "sky"    },
  addon:     { label: "Other Add-ons",          icon: Package,   accent: "zinc"   },
};

const ACCENT: Record<string, string> = {
  blue:   "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20",
  amber:  "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
  teal:   "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20",
  indigo: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20",
  rose:    "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20",
  violet: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20",
  yellow: "text-yellow-700 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20",
  sky:    "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border-sky-100 dark:border-sky-500/20",
  zinc:   "text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-500/10 border-zinc-100 dark:border-zinc-500/20",
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
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-2xl transition-all hover:scale-105 hover:shadow-md cursor-default">
      <div className={`w-2 h-2 rounded-full ${dot} shadow-[0_0_8px_currentColor]`} />
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.2em] leading-none mb-1">{label}</span>
        <span className="text-sm font-black text-zinc-900 dark:text-white leading-none">{value}</span>
      </div>
    </div>
  );
}

// ─── SubCategory Group ─────────────────────────────────────────────────────

function SubCategoryGroup({
  label,
  products,
  onEdit,
  onToggle,
}: {
  label: string;
  products: Product[];
  onEdit: (p: Product) => void;
  onToggle: (p: Product) => void;
}) {
  const [open, setOpen] = useState(true);
  
  return (
    <div className="border-t border-zinc-100 dark:border-zinc-800 first:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 bg-zinc-50/30 dark:bg-zinc-900 hover:bg-zinc-100/50 dark:hover:bg-zinc-900 transition-all group/sub"
      >
        <div className="flex items-center gap-3">
          <div className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
            <ChevronDown className="w-4 h-4 text-zinc-400 group-hover/sub:text-blue-500" />
          </div>
          <span className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em] group-hover/sub:text-blue-600 dark:group-hover/sub:text-blue-400 transition-colors">
            {label || "General Infrastructure"}
          </span>
          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{products.length} Items</span>
        </div>
        <div className="h-px flex-1 mx-6 bg-gradient-to-r from-zinc-200/50 to-transparent dark:from-zinc-800/50" />
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-500">
              <tr className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-900 dark:text-white">
                <th className="px-6 py-4 w-[35%]">SKU / Information</th>
                <th className="px-6 py-4 w-[15%]">Manufacturer</th>
                <th className="px-6 py-4 w-[15%]">Hardware Specs</th>
                <th className="px-6 py-4 text-right w-[15%]">Pricing Engine</th>
                <th className="px-6 py-4 text-center w-[10%]">Status</th>
                <th className="px-6 py-4 text-center w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50/50 dark:divide-zinc-900/50 bg-white dark:bg-zinc-900 transition-colors duration-500">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={`group/row transition-all duration-300 ${!p.is_active ? "opacity-50 grayscale-[0.5]" : "hover:bg-blue-50/20 dark:hover:bg-blue-900/5"}`}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 group-hover/row:border-blue-200 dark:group-hover/row:border-blue-900/50 transition-all">
                        <Package className="w-5 h-5 text-zinc-400 group-hover/row:text-blue-500 transition-colors" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-sm text-zinc-900 dark:text-white group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors truncate">
                          {p.display_name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">{p.technical_name || "ID_MISSING"}</code>
                          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                          <span className="text-[9px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-tighter">Verified SKU</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-400">
                        {(p.brand || "G")[0]}
                      </div>
                      <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
                        {p.brand || "Generic"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      {p.resolution_mp && (
                        <div className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-[9px] font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 uppercase tracking-widest">
                          {p.resolution_mp}MP
                        </div>
                      )}
                      {p.channels && (
                        <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-[9px] font-black text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800 uppercase tracking-widest">
                          {p.channels}CH
                        </div>
                      )}
                      <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${TECH_PILL[p.technology] || TECH_PILL.HD}`}>
                        {p.technology}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums">
                        ₹{sellingPrice(p).toLocaleString("en-IN")}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 line-through">₹{Number(p.base_cost || 0).toLocaleString()}</span>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/5 px-1.5 rounded-md">+{p.margin_percentage}%</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={() => onToggle(p)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-500 ${
                        p.is_active ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-zinc-200 dark:bg-zinc-800"
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500 shadow-sm ${p.is_active ? "left-7" : "left-1"}`} />
                    </button>
                    <p className="text-[8px] font-black uppercase tracking-widest mt-2 text-zinc-500 dark:text-zinc-400">
                      {p.is_active ? "Live" : "Standby"}
                    </p>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(p)}
                        className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-900 dark:hover:border-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
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

// ─── Category Section ──────────────────────────────────────────────────────

function CategorySection({
  categoryKey,
  products,
  onEdit,
  onToggle,
}: {
  categoryKey: string;
  products: Product[];
  onEdit: (p: Product) => void;
  onToggle: (p: Product) => void;
}) {
  const [open, setOpen] = useState(true);
  const cfg = CATEGORIES[categoryKey] || { label: categoryKey, icon: Package, accent: "zinc" };
  const Icon = cfg.icon;
  const acc = ACCENT[cfg.accent];

  // Group by catalog_path (Sub-categories)
  const subGroups = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach(p => {
      const pathParts = (p.catalog_path || "General").split('/');
      const subName = pathParts.length > 2 ? pathParts.slice(2).join(' › ') : (pathParts[pathParts.length-1] || "General");
      if (!groups[subName]) groups[subName] = [];
      groups[subName].push(p);
    });
    return groups;
  }, [products]);

  if (products.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-200/50 dark:border-zinc-800 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-none bg-white dark:bg-zinc-900 group/cat transition-all duration-500 hover:shadow-md">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-8 py-6 border-b transition-all duration-500 relative overflow-hidden ${acc}`}
      >
        <div className="absolute inset-0 bg-white dark:bg-black opacity-0 group-hover/cat:opacity-100 transition-opacity duration-700" />
        <div className="flex items-center gap-5 relative z-10">
          <div className={`w-12 h-12 rounded-[22px] flex items-center justify-center border shadow-md transition-transform duration-500 group-hover/cat:scale-110 group-hover/cat:rotate-3 ${acc}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-xs font-black uppercase tracking-[0.3em] block leading-none mb-1.5">{cfg.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-widest block">Operational Hardware Library</span>
              <span className="w-1 h-1 rounded-full bg-current opacity-50" />
              <span className="text-[9px] font-black px-3 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-current/10 shadow-sm">
                {products.length} SKU{products.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className={`transition-all duration-500 relative z-10 ${open ? "rotate-180" : ""}`}>
          <ChevronDown className="w-6 h-6 opacity-30 group-hover/cat:opacity-100" />
        </div>
      </button>

      {open && (
        <div className="flex flex-col bg-white dark:bg-transparent">
          {Object.entries(subGroups).sort().map(([subLabel, items]) => (
            <SubCategoryGroup
              key={subLabel}
              label={subLabel}
              products={items}
              onEdit={onEdit}
              onToggle={onToggle}
            />
          ))}
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
  onFiltersChange?: (filters: { category: string; technology: string }) => void;
}

export function ProductInventory({ products, onEdit, onToggle, onFiltersChange }: ProductInventoryProps) {
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState<string>("all");
  const [filterTech, setFilterTech] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");

  // Notify parent whenever category or technology filters change
  useEffect(() => {
    onFiltersChange?.({
      category: filterCat === "all" ? "" : filterCat,
      technology: filterTech === "all" ? "" : filterTech,
    });
  }, [filterCat, filterTech, onFiltersChange]);

  const brands = useMemo(() => {
    const b = new Set<string>();
    products.forEach(p => { if (p.brand) b.add(p.brand); });
    return Array.from(b).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.display_name.toLowerCase().includes(q) ||
        p.technical_name?.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q);
      const matchCat    = filterCat === "all"    || (p.category || "addon") === filterCat;
      const matchTech   = filterTech === "all"   || p.technology === filterTech;
      const matchStatus = filterStatus === "all" || (filterStatus === "active" ? p.is_active : !p.is_active);
      const matchBrand  = filterBrand === "all"  || p.brand === filterBrand;
      return matchSearch && matchCat && matchTech && matchStatus && matchBrand;
    });
  }, [products, search, filterCat, filterTech, filterStatus, filterBrand]);

  const counts = useMemo(() => ({
    camera:    filtered.filter((p) => p.category === "camera").length,
    recorder:  filtered.filter((p) => p.category === "recorder").length,
    addons:    filtered.filter((p) => !["camera", "recorder"].includes(p.category || "")).length,
    active:    products.filter((p) => p.is_active).length,
    total:     products.length,
  }), [filtered, products]);

  return (
    <div className="space-y-12">

      {/* ── Stats bar ── */}
      <div className="flex flex-wrap gap-4 px-2">
        <Chip label="Total Master Catalog"  value={counts.total}     dot="bg-zinc-400 dark:bg-zinc-600" />
        <Chip label="Vision Sensors"        value={counts.camera}    dot="bg-blue-500" />
        <Chip label="Processing Units"      value={counts.recorder}  dot="bg-amber-500" />
        <Chip label="Infrastructure"         value={counts.addons}    dot="bg-teal-500" />
        <Chip label="Active Deployment"      value={counts.active}    dot="bg-emerald-500" />
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-8 relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Filter className="w-32 h-32 text-zinc-900 dark:text-white" />
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-[22px] bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center shadow-md shadow-zinc-900/20 dark:shadow-white/5">
             <ListFilter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">Intelligent Inventory Filter</h3>
            <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.2em] mt-1">Refine your view across 1,776 unique SKUs</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 relative z-10">
          {/* Search */}
          <div className="relative group col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-2">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, SKU, or manufacturer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl pl-12 pr-6 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder-zinc-500 dark:placeholder-zinc-500 shadow-sm"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="w-full appearance-none bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer shadow-sm">
              <option value="all">All Segments</option>
              {Object.entries(CATEGORIES).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>

          {/* Brand Filter */}
          <div className="relative">
            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="w-full appearance-none bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer shadow-sm">
              <option value="all">All Manufacturers</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>

          {/* Technology filter */}
          <div className="relative">
            <select value={filterTech} onChange={(e) => setFilterTech(e.target.value)} className="w-full appearance-none bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer shadow-sm">
              <option value="all">Any Technology</option>
              <option value="IP">Digital IP System</option>
              <option value="HD">Analog HD System</option>
              <option value="both">Hybrid Tech</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full appearance-none bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer shadow-sm">
              <option value="all">Any Status</option>
              <option value="active">Active Deployment</option>
              <option value="inactive">Off-line / Archive</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Category groups ── */}
      <div className="space-y-12">
        {["camera", "recorder", ...Object.keys(CATEGORIES).filter(k => !["camera", "recorder"].includes(k))].map((cat) => {
          const items = filtered.filter((p) => {
            const pCat = p.category || "addon";
            return pCat === cat;
          });
          
          return (
            <CategorySection
              key={cat}
              categoryKey={cat}
              products={items}
              onEdit={onEdit}
              onToggle={onToggle}
            />
          );
        })}
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="relative flex flex-col items-center gap-8 py-40 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[60px] overflow-hidden group/empty transition-all duration-700">
          {/* Decorative background flair */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl group-hover/empty:bg-blue-500/10 transition-colors duration-1000" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-zinc-500/5 rounded-full blur-3xl group-hover/empty:bg-zinc-500/10 transition-colors duration-1000" />
          
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-md group-hover/empty:rotate-6 transition-transform duration-700">
              <Package className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg animate-bounce">
              <Search className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Zero Alignment Detected</h3>
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-500 max-w-sm mx-auto leading-relaxed uppercase tracking-widest opacity-60">
              The current matrix filter has isolated the system from all 1,732 catalog nodes.
            </p>
          </div>

          <button 
            onClick={() => {setSearch(""); setFilterCat("all"); setFilterTech("all"); setFilterStatus("all"); setFilterBrand("all");}}
            className="relative z-10 px-10 py-4 rounded-[20px] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:shadow-md hover:shadow-blue-500/20 active:scale-95 group/btn overflow-hidden"
          >
            <span className="relative z-10">Reset Multi-Channel Filters</span>
            <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
          </button>
        </div>
      )}
    </div>
  );
}
