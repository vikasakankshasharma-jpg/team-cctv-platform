import { useState, useMemo, useEffect } from "react";
import { 
  Search, ChevronDown, ChevronRight, Edit2, Camera, Monitor, 
  Layers, Zap, Package, HardDrive, Cpu, ShieldCheck,
  ListFilter, Filter, Wrench, Shield, Tv, Box, Server, Square, CheckSquare
} from "lucide-react";
import type { Product } from "@/types";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// â”€â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MUST_HAVE_CATEGORIES: Record<string, { label: string; icon: any }> = {
  cctv_camera:  { label: "Cameras (IP/HD)",         icon: Camera },
  recorder:     { label: "Recorders (NVR/DVR/XVR)", icon: Monitor },
  storage:      { label: "Storage (HDD/SD)",        icon: HardDrive },
  connector:    { label: "Connectors (RJ45/BNC/DC)",icon: Zap },
  cable:        { label: "Cables (CAT6/3+1)",       icon: Layers },
  power_device: { label: "Power Device (PoE/SMPS)", icon: Cpu },
};

const OPTIONAL_CATEGORIES: Record<string, { label: string; icon: any }> = {
  display:      { label: "Display Screen (LCD/TV)",    icon: Tv },
  camera_mount: { label: "Camera Mount Box",           icon: Box },
  rack:         { label: "Racks (Recorder/Switch)",    icon: Server },
  network:      { label: "Network Devices (Router)",   icon: Cpu },
  hdmi_cable:   { label: "HDMI Cables",                icon: Layers },
  accessories:  { label: "Other Accessories",          icon: Package },
  others:       { label: "Installation / Others",      icon: Wrench },
  unidentified: { label: "Uncategorized Imported Hardware", icon: Package },
};

const CATEGORIES = { ...MUST_HAVE_CATEGORIES, ...OPTIONAL_CATEGORIES };

function sellingPrice(p: Product): number {
  if (p.base_cost !== undefined && p.margin_percentage !== undefined) {
    return Math.round(p.base_cost + p.base_cost * (p.margin_percentage / 100));
  }
  return p.unit_price ?? 0;
}

// â”€â”€â”€ Stat Chip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Chip({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl shadow-sm cursor-default flex-1 min-w-[140px]">
      <div className={`w-2 h-2 rounded-full ${dot}`} />
      <div className="flex flex-col">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</span>
        <span className="text-sm font-semibold text-foreground leading-none">{value}</span>
      </div>
    </div>
  );
}

// â”€â”€â”€ SubCategory Group â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SubCategoryGroup({
  label,
  products,
  onEdit,
  onToggle,
  selectedIds,
  onToggleSelect,
  onSelectAllGroup,
  onDeselectAllGroup
}: {
  label: string;
  products: Product[];
  onEdit: (p: Product) => void;
  onToggle: (p: Product) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAllGroup?: (ids: string[]) => void;
  onDeselectAllGroup?: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(true);
  
  const allSelected = products.every(p => p.id && selectedIds?.has(p.id));
  const someSelected = products.some(p => p.id && selectedIds?.has(p.id));

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allSelected) {
      onDeselectAllGroup?.(products.map(p => p.id).filter((id): id is string => !!id));
    } else {
      onSelectAllGroup?.(products.map(p => p.id).filter((id): id is string => !!id));
    }
  };
  
  return (
    <div className="border-t border-border first:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors group/sub"
      >
        <div className="flex items-center gap-3">
          {selectedIds && (
            <div onClick={handleSelectAll} className="mr-2 cursor-pointer hover:opacity-80">
              {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : someSelected ? <Square className="w-4 h-4 text-primary opacity-50 fill-primary/20" /> : <Square className="w-4 h-4 text-muted-foreground" />}
            </div>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          <span className="text-xs font-semibold text-foreground">
            {label || "General Infrastructure"}
          </span>
          <Badge variant="secondary" className="text-[10px]">{products.length} Items</Badge>
        </div>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/20 border-y border-border">
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 w-[25%] font-medium">SKU / Information</th>
                <th className="px-6 py-3 w-[15%] font-medium">Manufacturer</th>
                <th className="px-6 py-3 w-[15%] font-medium">Specs</th>
                <th className="px-6 py-3 text-center w-[10%] font-medium">Stock</th>
                <th className="px-6 py-3 text-right w-[15%] font-medium">Pricing</th>
                <th className="px-6 py-3 text-center w-[10%] font-medium">Status</th>
                <th className="px-6 py-3 text-center w-[10%] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {products.map((p) => {
                const isSelected = p.id ? selectedIds?.has(p.id) : false;
                return (
                  <tr
                    key={p.id}
                    className={`group/row transition-colors ${!p.is_active ? "opacity-60 bg-muted/10" : "hover:bg-muted/30"} ${isSelected ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {selectedIds && (
                          <div onClick={() => p.id && onToggleSelect?.(p.id)} className="mr-1 cursor-pointer hover:opacity-80">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        )}
                        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center border border-border">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {p.display_name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <code className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                              {p.internal_sku ? `SKU: ${p.internal_sku}` : "NO SKU"}
                            </code>
                            <code className="text-[10px] font-mono text-muted-foreground">{p.technical_name || "ID_MISSING"}</code>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {p.brand || "Generic"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {p.resolution_mp && (
                          <Badge variant="outline" className="text-[9px] bg-primary/5 text-primary border-primary/20">
                            {p.resolution_mp}MP
                          </Badge>
                        )}
                        {p.channels && (
                          <Badge variant="outline" className="text-[9px]">
                            {p.channels}CH
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[9px]">
                          {p.technologies?.join(', ') || "HD"}
                        </Badge>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Badge variant={p.stock_quantity === undefined ? "secondary" : p.stock_quantity <= 0 ? "destructive" : p.stock_quantity < 10 ? "secondary" : "default"} className={`text-[10px] ${p.stock_quantity !== undefined && p.stock_quantity > 0 && p.stock_quantity >= 10 ? 'bg-success/10 text-success hover:bg-success/20' : ''}`}>
                        {p.stock_quantity === undefined ? "N/A" : p.stock_quantity}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-foreground">
                          ₹{sellingPrice(p).toLocaleString("en-IN")}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground line-through">₹{Number(p.base_cost || 0).toLocaleString()}</span>
                          <span className="text-[10px] font-medium text-success">+{p.margin_percentage}%</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => onToggle(p)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            p.is_active ? "bg-success" : "bg-muted"
                          }`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${p.is_active ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                        {/* Stock status badge */}
                        {(p.stock_status === "out_of_stock" || p.stock_status === "on_order" || p.stock_status === "discontinued") && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                            p.stock_status === "out_of_stock" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                            p.stock_status === "on_order" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                            "bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400"
                          }`}>
                            {p.stock_status === "out_of_stock" ? "Out of Stock" : p.stock_status === "on_order" ? "On Order" : "Discontinued"}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(p)}
                          className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Category Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CategorySection({
  categoryKey,
  products,
  onEdit,
  onToggle,
  selectedIds,
  onToggleSelect,
  onSelectAllGroup,
  onDeselectAllGroup
}: {
  categoryKey: string;
  products: Product[];
  onEdit: (p: Product) => void;
  onToggle: (p: Product) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAllGroup?: (ids: string[]) => void;
  onDeselectAllGroup?: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const cfg = CATEGORIES[categoryKey] || { label: categoryKey, icon: Package };
  const Icon = cfg.icon;

  // Group by catalog_path (Sub-categories)
  const subGroups = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach(p => {
      const pathParts = (p.catalog_path || "General").split('/');
      const subName = pathParts.length > 2 ? pathParts.slice(2).join(' â€º ') : (pathParts[pathParts.length-1] || "General");
      if (!groups[subName]) groups[subName] = [];
      groups[subName].push(p);
    });
    return groups;
  }, [products]);

  if (products.length === 0) return null;

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 bg-card hover:bg-muted/30 transition-colors border-b border-border"
      >
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-secondary text-foreground">
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold tracking-tight block">{cfg.label}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground font-medium">Hardware Library</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <Badge variant="outline" className="text-[9px] font-medium">{products.length} Items</Badge>
            </div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="flex flex-col bg-card">
          {Object.entries(subGroups).sort().map(([subLabel, items]) => (
            <SubCategoryGroup
              key={subLabel}
              label={subLabel}
              products={items}
              onEdit={onEdit}
              onToggle={onToggle}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onSelectAllGroup={onSelectAllGroup}
              onDeselectAllGroup={onDeselectAllGroup}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// â”€â”€â”€ Main Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ProductInventoryProps {
  products: Product[];
  onEdit: (p: Product) => void;
  onToggle: (p: Product) => void;
  onFiltersChange?: (filters: { category: string; technology: string }) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAllGroup?: (ids: string[]) => void;
  onDeselectAllGroup?: (ids: string[]) => void;
}

export function ProductInventory({ 
  products, 
  onEdit, 
  onToggle, 
  onFiltersChange,
  selectedIds,
  onToggleSelect,
  onSelectAllGroup,
  onDeselectAllGroup
}: ProductInventoryProps) {
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState<string>("all");
  const [filterTech, setFilterTech] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState<number>(50);

  useEffect(() => {
    onFiltersChange?.({
      category: filterCat === "all" ? "" : filterCat,
      technology: filterTech === "all" ? "" : filterTech,
    });
  }, [filterCat, filterTech, onFiltersChange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(50);
  }, [search, filterCat, filterTech, filterStatus, filterBrand]);

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
        p.internal_sku?.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q);
      const matchCat    = filterCat === "all"    || (p.category || "addon") === filterCat;
      const matchTech   = filterTech === "all"   || p.technologies?.includes(filterTech as any);
      const matchStatus = filterStatus === "all" || (filterStatus === "active" ? p.is_active : !p.is_active);
      const matchBrand  = filterBrand === "all"  || p.brand === filterBrand;
      return matchSearch && matchCat && matchTech && matchStatus && matchBrand;
    });
  }, [products, search, filterCat, filterTech, filterStatus, filterBrand]);

  const counts = useMemo(() => ({
    camera:    filtered.filter((p) => p.category === "cctv_camera").length,
    recorder:  filtered.filter((p) => p.category === "recorder").length,
    addons:    filtered.filter((p) => !["cctv_camera", "recorder"].includes(p.category || "")).length,
    active:    products.filter((p) => p.is_active).length,
    total:     products.length,
  }), [filtered, products]);

  const visibleFiltered = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  return (
    <div className="space-y-8">

      {/* â”€â”€ Stats bar â”€â”€ */}
      <div className="flex flex-wrap gap-4 px-1">
        <Chip label="Total Master Catalog"  value={counts.total}     dot="bg-muted-foreground" />
        <Chip label="Vision Sensors"        value={counts.camera}    dot="bg-primary" />
        <Chip label="Processing Units"      value={counts.recorder}  dot="bg-amber-500" />
        <Chip label="Infrastructure"        value={counts.addons}    dot="bg-teal-500" />
        <Chip label="Active Deployment"     value={counts.active}    dot="bg-success" />
      </div>

      {/* â”€â”€ Filter bar â”€â”€ */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-secondary text-foreground">
             <ListFilter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight">Inventory Filters</h3>
            <p className="text-xs text-muted-foreground">Refine your view across {products.length} SKUs</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="all">All Segments</option>
            {Object.entries(CATEGORIES).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>

          <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="all">All Manufacturers</option>
            {brands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select value={filterTech} onChange={(e) => setFilterTech(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="all">Any Technology</option>
            <option value="IP">Digital IP System</option>
            <option value="HD">Analog HD System</option>
            <option value="both">Hybrid Tech</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="all">Any Status</option>
            <option value="active">Active Deployment</option>
            <option value="inactive">Off-line / Archive</option>
          </select>
        </div>
      </Card>

      {/* â”€â”€ Category groups â”€â”€ */}
      <div>
        <div className="pt-4 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-primary">Must Have for Wired Setup</h2>
          <p className="text-sm text-muted-foreground">Essential core system and labor components.</p>
        </div>
        {Object.keys(MUST_HAVE_CATEGORIES).map((cat) => {
          const items = visibleFiltered.filter((p) => {
            const pCat = p.category || "accessories";
            return pCat === cat;
          });
          
          return (
            <CategorySection
              key={cat}
              categoryKey={cat}
              products={items}
              onEdit={onEdit}
              onToggle={onToggle}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onSelectAllGroup={onSelectAllGroup}
              onDeselectAllGroup={onDeselectAllGroup}
            />
          );
        })}

        <div className="pt-8 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-primary">Optional Upgrades</h2>
          <p className="text-sm text-muted-foreground">Add-ons, maintenance, and secondary hardware.</p>
        </div>
        {Object.keys(OPTIONAL_CATEGORIES).map((cat) => {
          const items = visibleFiltered.filter((p) => {
            const pCat = p.category || "accessories";
            return pCat === cat;
          });
          
          return (
            <CategorySection
              key={cat}
              categoryKey={cat}
              products={items}
              onEdit={onEdit}
              onToggle={onToggle}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onSelectAllGroup={onSelectAllGroup}
              onDeselectAllGroup={onDeselectAllGroup}
            />
          );
        })}
      </div>

      {visibleCount < filtered.length && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={() => setVisibleCount(v => v + 50)}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-2.5 rounded-full text-xs font-semibold transition-colors"
          >
            Load More
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* â”€â”€ Empty state â”€â”€ */}
      {filtered.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight mb-2">No products found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            We couldn't find any products matching your current filters.
          </p>
          <button 
            onClick={() => {setSearch(""); setFilterCat("all"); setFilterTech("all"); setFilterStatus("all"); setFilterBrand("all");}}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-md text-sm font-semibold transition-colors"
          >
            Reset Filters
          </button>
        </Card>
      )}
    </div>
  );
}
