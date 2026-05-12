import { useState, useMemo } from "react";
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
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-black text-zinc-900 dark:text-white">{value}</span>
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
    <div className="border-t border-zinc-100 dark:border-zinc-800/60 first:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-5 py-3 bg-zinc-50/50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
      >
        {open ? <ChevronDown className="w-3 h-3 text-zinc-500" /> : <ChevronRight className="w-3 h-3 text-zinc-500" />}
        <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.15em]">
          {label || "General Infrastructure"}
        </span>
        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600">({products.length})</span>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/60">
              <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                <th className="px-5 py-3 w-[30%]">Product / Model ID</th>
                <th className="px-5 py-3 w-[15%]">Manufacturer</th>
                <th className="px-5 py-3 w-[15%]">Specs</th>
                <th className="px-5 py-3 text-right w-[12%]">Purchase (₹)</th>
                <th className="px-5 py-3 text-right w-[10%]">Margin</th>
                <th className="px-5 py-3 text-right w-[13%]">Sale Price</th>
                <th className="px-5 py-3 text-center w-[5%]">Status</th>
                <th className="px-5 py-3 text-center w-[5%]">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/20 transition-all group/row ${!p.is_active ? "bg-zinc-50/30 dark:bg-zinc-950/20 opacity-60" : ""}`}
                >
                  <td className="px-5 py-4">
                    <div className="font-bold text-sm text-zinc-900 dark:text-white group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors leading-tight">
                      {p.display_name}
                    </div>
                    {p.technical_name && (
                      <code className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mt-1 block">
                        {p.technical_name}
                      </code>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                      {p.brand || <span className="text-zinc-300 dark:text-zinc-700">Generic</span>}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {p.resolution_mp && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded text-[9px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">
                          {p.resolution_mp}MP
                        </span>
                      )}
                      {p.channels && (
                        <span className="inline-flex px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                          {p.channels}CH
                        </span>
                      )}
                      <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${TECH_PILL[p.technology] || TECH_PILL.HD}`}>
                        {p.technology}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <span className="text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-400">
                      {p.base_cost !== undefined
                        ? `₹${Number(p.base_cost).toLocaleString("en-IN")}`
                        : <span className="text-zinc-300 dark:text-zinc-700">—</span>}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    {p.margin_percentage !== undefined ? (
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500">
                        +{p.margin_percentage}%
                      </span>
                    ) : <span className="text-zinc-300 dark:text-zinc-700 text-[9px]">—</span>}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-black text-zinc-900 dark:text-white">
                      ₹{sellingPrice(p).toLocaleString("en-IN")}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => onToggle(p)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                        p.is_active
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100"
                          : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-emerald-500 animate-pulse" : "bg-zinc-400 dark:bg-zinc-700"}`} />
                      {p.is_active ? "Live" : "Off"}
                    </button>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => onEdit(p)}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-blue-600 hover:border-blue-400 dark:hover:border-blue-500/40 flex items-center justify-center mx-auto transition-all active:scale-90 shadow-sm"
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

  if (products.length === 0) return null;

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

  return (
    <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-xl shadow-zinc-200/20 dark:shadow-none bg-white dark:bg-zinc-950/40 transition-all">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-6 py-4 border-b ${acc} transition-all hover:bg-opacity-95`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm ${acc}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] block leading-none">{cfg.label}</span>
            <span className="text-[9px] font-bold text-zinc-500/80 dark:text-zinc-400/60 uppercase tracking-widest mt-1 block">Inventory Segment</span>
          </div>
          <span className="ml-2 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-current/10 shadow-sm">
            {products.length}
          </span>
        </div>
        {open ? <ChevronDown className="w-5 h-5 opacity-50" /> : <ChevronRight className="w-5 h-5 opacity-50" />}
      </button>

      {open && (
        <div className="flex flex-col">
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
}

export function ProductInventory({ products, onEdit, onToggle }: ProductInventoryProps) {
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState<string>("all");
  const [filterTech, setFilterTech] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");

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

  const SEL = "bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer";

  return (
    <div className="space-y-8">

      {/* ── Stats bar ── */}
      <div className="flex flex-wrap gap-2">
        <Chip label="Total SKUs"  value={counts.total}     dot="bg-zinc-400" />
        <Chip label="Cameras"     value={counts.camera}    dot="bg-blue-500" />
        <Chip label="Recorders"   value={counts.recorder}  dot="bg-amber-500" />
        <Chip label="Addons/Cables" value={counts.addons}  dot="bg-teal-500" />
        <Chip label="Active"      value={counts.active}    dot="bg-emerald-500" />
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ListFilter className="w-4 h-4 text-zinc-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Advanced Filters</span>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Quick search by name, SKU, brand…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-zinc-400 dark:placeholder-zinc-700"
            />
          </div>

          <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800 mx-1 hidden md:block" />

          {/* Category filter */}
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className={SEL}>
            <option value="all">All Categories</option>
            {Object.entries(CATEGORIES).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>

          {/* Brand Filter */}
          <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className={SEL}>
            <option value="all">All Brands</option>
            {brands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Technology filter */}
          <select value={filterTech} onChange={(e) => setFilterTech(e.target.value)} className={SEL}>
            <option value="all">All Tech</option>
            <option value="IP">Digital IP</option>
            <option value="HD">Analog HD</option>
            <option value="both">Multi-Tech</option>
          </select>

          {/* Status filter */}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={SEL}>
            <option value="all">All Status</option>
            <option value="active">Live in Wizard</option>
            <option value="inactive">Hidden (Off)</option>
          </select>
        </div>
      </div>

      {/* ── Category groups ── */}
      <div className="space-y-6">
        {/* Sort categories: Cameras first, then Recorders, then others */}
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
        <div className="flex flex-col items-center gap-4 py-24 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[24px]">
          <div className="w-14 h-14 rounded-[20px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
            <Package className="w-7 h-7 text-zinc-300 dark:text-zinc-700" />
          </div>
          <p className="text-xs font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
            No products match your filters
          </p>
          <button 
            onClick={() => {setSearch(""); setFilterCat("all"); setFilterTech("all"); setFilterStatus("all"); setFilterBrand("all");}}
            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
