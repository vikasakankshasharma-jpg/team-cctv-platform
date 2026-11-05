import { useState, useMemo, useEffect } from "react";
import { 
  Search, ChevronDown, ChevronRight, Edit2, Copy, Camera, Monitor, Plus, 
  Layers, Zap, Package, HardDrive, Cpu, ShieldCheck,
  ListFilter, Filter, Wrench, Shield, Tv, Box, Server, Square, CheckSquare, Trash2, X, ArrowUp, ArrowDown, ArrowUpDown
} from "lucide-react";
import type { Product } from "@/types";
import { 
  getCanonicalBrandKey, 
  getCanonicalBrandName, 
  inferBrandFromName, 
  isBrandMatch 
} from "@/lib/brand-utils";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// â”€â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MUST_HAVE_CATEGORIES: Record<string, { label: string; icon: any }> = {
  cctv_camera:  { label: "Cameras (IP / HD / Wi-Fi)", icon: Camera },
  recorder:     { label: "Recorders (NVR/DVR/XVR)",    icon: Monitor },
  storage:      { label: "Storage (HDD & MicroSD)",    icon: HardDrive },
  connector:    { label: "Connectors (RJ45/BNC/DC)",   icon: Zap },
  cable:        { label: "Cables (CAT6/3+1)",          icon: Layers },
  power_device: { label: "Power Device (PoE/SMPS)",    icon: Cpu },
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
  if (p.unit_price !== undefined && p.unit_price > 0) {
    return p.unit_price;
  }
  if (p.base_cost !== undefined && p.margin_percentage !== undefined) {
    return Math.round(p.base_cost + p.base_cost * (p.margin_percentage / 100));
  }
  return 0;
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


type SortField = "name" | "brand" | "stock" | "price" | "status" | null;
type SortDirection = "asc" | "desc";

function sortProducts(products: Product[], field?: SortField, direction?: SortDirection): Product[] {
  if (!field) return products;
  const dir = direction || "asc";

  return [...products].sort((a, b) => {
    let cmp = 0;
    if (field === "name") {
      const nameA = (a.display_name || a.technical_name || "").toLowerCase();
      const nameB = (b.display_name || b.technical_name || "").toLowerCase();
      cmp = nameA.localeCompare(nameB);
    } else if (field === "brand") {
      const brandA = (a.brand || "").toLowerCase();
      const brandB = (b.brand || "").toLowerCase();
      cmp = brandA.localeCompare(brandB);
    } else if (field === "price") {
      const priceA = sellingPrice(a);
      const priceB = sellingPrice(b);
      cmp = priceA - priceB;
    } else if (field === "stock") {
      const stockA = typeof a.stock_quantity === "number" ? a.stock_quantity : (a.in_stock ? 100 : -1);
      const stockB = typeof b.stock_quantity === "number" ? b.stock_quantity : (b.in_stock ? 100 : -1);
      cmp = stockA - stockB;
    } else if (field === "status") {
      const statusA = a.is_active ? 1 : 0;
      const statusB = b.is_active ? 1 : 0;
      cmp = statusA - statusB;
    }

    return dir === "asc" ? cmp : -cmp;
  });
}

function SubCategoryGroup({
  label,
  products,
  onEdit,
    onDuplicate,
    onToggle,
    onDelete,
  selectedIds,
  onToggleSelect,
  onSelectAllGroup,
  onDeselectAllGroup,
  sortField,
  sortDirection = "asc",
  onToggleSort
}: {
  label: string;
  products: Product[];
  onEdit: (p: Product) => void;
    onDuplicate?: (p: Product) => void;
  onToggle: (p: Product) => void;
  onDelete?: (p: Product) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAllGroup?: (ids: string[]) => void;
  onDeselectAllGroup?: (ids: string[]) => void;
  onAddProduct?: (category: string) => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onToggleSort?: (field: SortField) => void;
}) {
  const [open, setOpen] = useState(true);

  const sortedProducts = useMemo(() => {
    return sortProducts(products, sortField, sortDirection);
  }, [products, sortField, sortDirection]);
  
  const allSelected = sortedProducts.every(p => p.id && selectedIds?.has(p.id));
  const someSelected = sortedProducts.some(p => p.id && selectedIds?.has(p.id));

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
          <table className="w-full table-fixed text-left text-sm border-collapse min-w-[900px]">
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead className="bg-muted/20 border-y border-border">
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground select-none">
                <th 
                  onClick={() => onToggleSort?.("name")} 
                  className="px-6 py-3 font-medium cursor-pointer hover:text-foreground transition-colors group/header"
                  title="Click to sort by SKU / Product Name"
                >
                  <div className="flex items-center gap-1.5">
                    <span>SKU / Information</span>
                    {sortField === "name" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => onToggleSort?.("brand")} 
                  className="px-6 py-3 font-medium cursor-pointer hover:text-foreground transition-colors group/header"
                  title="Click to sort by Manufacturer"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Manufacturer</span>
                    {sortField === "brand" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 font-medium">Specs</th>
                <th 
                  onClick={() => onToggleSort?.("stock")} 
                  className="px-6 py-3 text-center font-medium cursor-pointer hover:text-foreground transition-colors group/header"
                  title="Click to sort by Stock Availability"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Stock</span>
                    {sortField === "stock" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => onToggleSort?.("price")} 
                  className="px-6 py-3 text-right font-medium cursor-pointer hover:text-foreground transition-colors group/header"
                  title="Click to sort by Pricing"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Pricing</span>
                    {sortField === "price" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => onToggleSort?.("status")} 
                  className="px-6 py-3 text-center font-medium cursor-pointer hover:text-foreground transition-colors group/header"
                  title="Click to sort by Active / Inactive Status"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Status</span>
                    {sortField === "status" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {sortedProducts.map((p) => {
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
                          <span className="font-semibold text-sm text-foreground line-clamp-2 leading-snug" title={p.display_name}>
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
                        {p.has_speaker ? (
                          <Badge variant="outline" className="text-[9px] bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800">
                            2-Way Talk
                          </Badge>
                        ) : p.has_audio ? (
                          <Badge variant="outline" className="text-[9px] bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800">
                            Mic
                          </Badge>
                        ) : null}
                        {p.has_sd_slot && (
                          <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800">
                            SD: {p.max_sd_capacity_gb || 128}GB
                          </Badge>
                        )}
                        {p.has_siren && (
                          <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-600 border-red-200 dark:border-red-800">
                            Siren
                          </Badge>
                        )}
                        {(p.is_metal_body || p.body_material === "metal") && (
                          <Badge variant="outline" className="text-[9px] bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200">
                            Metal
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Badge variant={p.stock_quantity === undefined ? "secondary" : p.stock_quantity <= 0 ? "destructive" : p.stock_quantity < 10 ? "secondary" : "default"} className={`text-[10px] ${p.stock_quantity !== undefined && p.stock_quantity > 0 && p.stock_quantity >= 10 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : ''}`}>
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
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">+{p.margin_percentage}%</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggle(p)}
                          title={p.is_active ? "Active in Store & Quotes (Click to Deactivate)" : "Inactive / Archived (Click to Activate)"}
                          className="group/toggle inline-flex items-center gap-2 cursor-pointer focus:outline-none select-none transition-transform active:scale-95"
                        >
                          {/* High-contrast accessible toggle track */}
                          <span
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out border ${
                              p.is_active
                                ? "bg-emerald-500 border-emerald-600 dark:bg-emerald-600 dark:border-emerald-500"
                                : "bg-zinc-200 border-zinc-300 dark:bg-zinc-700 dark:border-zinc-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                                p.is_active ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </span>

                          {/* Explicit visual text badge with indicator dot */}
                          {p.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-zinc-100 text-zinc-500 border border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                              Inactive
                            </span>
                          )}
                        </button>

                        {/* Stock status badge if out of stock */}
                        {(p.stock_status === "out_of_stock" || p.stock_status === "on_order" || p.stock_status === "discontinued") && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                            p.stock_status === "out_of_stock" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" :
                            p.stock_status === "on_order" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" :
                            "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-400 dark:border-zinc-800"
                          }`}>
                            {p.stock_status === "out_of_stock" ? "Out of Stock" : p.stock_status === "on_order" ? "On Order" : "Discontinued"}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(p)}
                          title="Edit Product"
                          className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {onDelete && (
                          <button
                            onClick={() => onDelete(p)}
                            title="Delete Product"
                            className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
    onDuplicate,
    onToggle,
    onDelete,
  selectedIds,
  onToggleSelect,
  onSelectAllGroup,
  onDeselectAllGroup,
  onAddProduct,
  filterTech = "all",
  sortField,
  sortDirection = "asc",
  onToggleSort
}: {
  categoryKey: string;
  products: Product[];
  onEdit: (p: Product) => void;
    onDuplicate?: (p: Product) => void;
  onToggle: (p: Product) => void;
  onDelete?: (p: Product) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAllGroup?: (ids: string[]) => void;
  onDeselectAllGroup?: (ids: string[]) => void;
  onAddProduct?: (category: string, technology?: string) => void;
  filterTech?: string;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onToggleSort?: (field: SortField) => void;
}) {
  const [open, setOpen] = useState(true);
  const cfg = CATEGORIES[categoryKey] || { label: categoryKey, icon: Package };
  const Icon = cfg.icon;

  // Group by catalog_path (Sub-categories) with smart wireless detection
  const subGroups = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach(p => {
      let path = p.catalog_path || p.group_path;
      if (!path) {
        const t = (p.technology || p.technologies?.[0] || "").toLowerCase();
        const name = (p.display_name || p.technical_name || "").toLowerCase();
        if (p.category === "cctv_camera") {
          if (t === "wireless" || t === "wifi" || (p as any).has_wifi) path = "cctv_camera/wifi/WiFi Camera";
          else if (t === "ip") path = "cctv_camera/ip/IP Camera";
          else path = "cctv_camera/hd/HD Camera";
        } else if (p.category === "recorder") {
          if (t === "ip" || name.includes("nvr")) path = "recorder/ip/IP NVR";
          else path = "recorder/hd/HD DVR";
        } else if (p.category === "storage") {
          if (t === "wireless" || (p as any).storage_type?.toLowerCase().includes("micro") || name.includes("microsd") || name.includes("sd card")) {
            path = "storage/microsd/MicroSD Card";
          } else {
            path = "storage/hdd/Surveillance HDD";
          }
        } else if (p.category === "power_device") {
          if (name.includes("poe")) path = "power_device/poe/PoE Switch";
          else if (name.includes("gigabit") || name.includes("switch")) path = "power_device/network/Network Switch";
          else path = "power_device/smps/SMPS Power Supply";
        } else if (p.category === "cable") {
          if (name.includes("cat6") || name.includes("lan") || name.includes("ethernet") || t === "ip") path = "cable/cat6/CAT6 Network Cable";
          else path = "cable/coaxial/3+1 Coaxial Cable";
        } else if (p.category === "connector") {
          if (name.includes("bnc")) path = "connector/bnc/BNC Video Connector";
          else if (name.includes("dc")) path = "connector/dc/DC Power Connector";
          else if (name.includes("rj45")) path = "connector/rj45/RJ45 Connector";
          else path = "connector/accessories/Connectors and Pins";
        } else if (p.category === "rack") {
          path = "rack/cctv_rack/Wall-Mount CCTV Rack";
        } else if (p.category === "hdmi_cable") {
          path = "hdmi_cable/display/HDMI Display Cable";
        } else if (p.category === "network") {
          if (name.includes("4g") || name.includes("sim") || name.includes("router")) path = "network/router/4G Wireless Router";
          else path = "network/general/Network Devices";
        } else if (p.category === "accessories") {
          if (name.includes("junction") || name.includes("box")) path = "accessories/junction/Waterproof Junction Box";
          else path = "accessories/general/Installation Accessories";
        } else {
          path = "General";
        }
      }
      const pathParts = path.split('/');
      let subName = pathParts.length > 2 ? pathParts.slice(2).join(' - ') : (pathParts[pathParts.length-1] || "General");
      if (subName === "HDD") subName = "Surveillance HDD";
      if (!groups[subName]) groups[subName] = [];
      groups[subName].push(p);
    });
    return groups;
  }, [products]);

  if (products.length === 0) return null;

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
      <div
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 bg-card hover:bg-muted/30 transition-colors border-b border-border cursor-pointer select-none"
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
        <div className="flex items-center gap-3">
           {onAddProduct && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddProduct(categoryKey, filterTech === "Wireless" ? "Wireless" : "HD"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors outline-none"
              >
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
           )}
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {open && (
        <div className="flex flex-col bg-card">
          {Object.entries(subGroups).sort().map(([subLabel, items]) => (
            <SubCategoryGroup
              key={subLabel}
              label={subLabel}
              products={items}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onToggle={onToggle}
              onDelete={onDelete}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onSelectAllGroup={onSelectAllGroup}
              onDeselectAllGroup={onDeselectAllGroup}
              onAddProduct={onAddProduct}
              sortField={sortField}
              sortDirection={sortDirection}
              onToggleSort={onToggleSort}
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
    onDuplicate?: (p: Product) => void;
  onToggle: (p: Product) => void;
  onDelete?: (p: Product) => void;
  onFiltersChange?: (filters: { category: string; technology: string }) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAllGroup?: (ids: string[]) => void;
  onDeselectAllGroup?: (ids: string[]) => void;
  onAddProduct?: (category: string, technology?: string) => void;
}


function matchesSearch(p: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    p.display_name.toLowerCase().includes(q) ||
    Boolean(p.technical_name?.toLowerCase().includes(q)) ||
    Boolean(p.internal_sku?.toLowerCase().includes(q)) ||
    Boolean((p.brand || '').toLowerCase().includes(q))
  );
}

function matchesTech(p: Product, tech: string): boolean {
  if (tech === "all") return true;
  return Boolean(
    p.technologies?.includes(tech as any) ||
    (tech === "Wireless" && (p.technologies?.includes("WiFi" as any) || p.technology === "Wireless" || p.technology === "WiFi" || (p as any).has_wifi)) ||
    (tech === "both" && (p.technologies?.includes("both" as any) || p.technologies?.includes("Common" as any) || p.technology === "Common")) ||
    p.technology === tech
  );
}

export function ProductInventory({ 
  products, 
  onEdit,
    onDuplicate,
    onToggle, 
    onDelete,
  onFiltersChange,
  selectedIds,
  onToggleSelect,
  onSelectAllGroup,
  onDeselectAllGroup,
  onAddProduct
}: ProductInventoryProps) {
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState<string>("all");
  const [filterTech, setFilterTech] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState<number>(50);
  const [sortField, setSortField]       = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleToggleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      const defaultDir = (field === "price" || field === "stock" || field === "status") ? "desc" : "asc";
      setSortDirection(defaultDir);
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortField(null);
      setSortDirection("asc");
    }
  };

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

    // Dynamic available brands based on category, technology, status, and search
  const availableBrands = useMemo(() => {
    const brandCounts = new Map<string, { name: string; count: number }>();

    for (const p of products) {
      if (search && !matchesSearch(p, search)) continue;
      if (filterStatus === "active" && !p.is_active) continue;
      if (filterStatus === "inactive" && p.is_active) continue;

      const pCat = p.category || "addon";
      if (filterCat !== "all" && pCat !== filterCat) continue;

      if (!matchesTech(p, filterTech)) continue;

      const rawBrand = p.brand || inferBrandFromName(p.display_name);
      if (!rawBrand) continue;
      const key = getCanonicalBrandKey(rawBrand);
      if (!key || key === "all") continue;
      const canonicalName = getCanonicalBrandName(rawBrand);

      const existing = brandCounts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        brandCounts.set(key, { name: canonicalName, count: 1 });
      }
    }

    return Array.from(brandCounts.values()).sort((a, b) => {
      if (a.name === "Budget Brand") return -1;
      if (b.name === "Budget Brand") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [products, search, filterCat, filterTech, filterStatus]);

  // Dynamic available categories based on brand, technology, status, and search
  const availableCategories = useMemo(() => {
    const catCounts = new Map<string, number>();

    for (const p of products) {
      if (search && !matchesSearch(p, search)) continue;
      if (filterStatus === "active" && !p.is_active) continue;
      if (filterStatus === "inactive" && p.is_active) continue;

      if (filterBrand !== "all" && !isBrandMatch(p, filterBrand)) continue;

      if (!matchesTech(p, filterTech)) continue;

      const pCat = p.category || "addon";
      catCounts.set(pCat, (catCounts.get(pCat) || 0) + 1);
    }

    const list: Array<{ key: string; label: string; count: number }> = [];
    for (const [key, cfg] of Object.entries(CATEGORIES)) {
      const count = catCounts.get(key) || 0;
      if (count > 0) {
        list.push({ key, label: cfg.label, count });
      }
    }

    for (const [key, count] of catCounts.entries()) {
      if (!CATEGORIES[key] && count > 0) {
        list.push({ key, label: key.charAt(0).toUpperCase() + key.slice(1), count });
      }
    }

    return list;
  }, [products, search, filterBrand, filterTech, filterStatus]);

  // Dynamic technology counts based on category, brand, status, and search
  const techCounts = useMemo(() => {
    const counts = { all: 0, IP: 0, HD: 0, Wireless: 0, both: 0 };
    for (const p of products) {
      if (search && !matchesSearch(p, search)) continue;
      if (filterStatus === "active" && !p.is_active) continue;
      if (filterStatus === "inactive" && p.is_active) continue;
      if (filterCat !== "all" && (p.category || "addon") !== filterCat) continue;
      if (filterBrand !== "all" && !isBrandMatch(p, filterBrand)) continue;

      counts.all += 1;
      if (matchesTech(p, "IP")) counts.IP += 1;
      if (matchesTech(p, "HD")) counts.HD += 1;
      if (matchesTech(p, "Wireless")) counts.Wireless += 1;
      if (matchesTech(p, "both")) counts.both += 1;
    }
    return counts;
  }, [products, search, filterCat, filterBrand, filterStatus]);

  // Dynamic status counts based on category, brand, technology, and search
  const statusCounts = useMemo(() => {
    const counts = { all: 0, active: 0, inactive: 0 };
    for (const p of products) {
      if (search && !matchesSearch(p, search)) continue;
      if (filterCat !== "all" && (p.category || "addon") !== filterCat) continue;
      if (filterBrand !== "all" && !isBrandMatch(p, filterBrand)) continue;
      if (!matchesTech(p, filterTech)) continue;

      counts.all += 1;
      if (p.is_active) counts.active += 1;
      else counts.inactive += 1;
    }
    return counts;
  }, [products, search, filterCat, filterBrand, filterTech]);

  // Bidirectional auto-reset handlers
  const handleCategoryChange = (newCat: string) => {
    setFilterCat(newCat);
    if (newCat !== "all" && filterBrand !== "all") {
      const hasProductsForBrand = products.some(p => {
        const matchSearch = matchesSearch(p, search);
        const matchCat = (p.category || "addon") === newCat;
        const matchBrand = isBrandMatch(p, filterBrand);
        const matchStatus = filterStatus === "all" || (filterStatus === "active" ? p.is_active : !p.is_active);
        const matchTech = matchesTech(p, filterTech);
        return matchSearch && matchCat && matchBrand && matchStatus && matchTech;
      });
      if (!hasProductsForBrand) {
        setFilterBrand("all");
      }
    }
  };

  const handleBrandChange = (newBrand: string) => {
    setFilterBrand(newBrand);
    if (newBrand !== "all" && filterCat !== "all") {
      const hasProductsForCat = products.some(p => {
        const matchSearch = matchesSearch(p, search);
        const matchCat = (p.category || "addon") === filterCat;
        const matchBrand = isBrandMatch(p, newBrand);
        const matchStatus = filterStatus === "all" || (filterStatus === "active" ? p.is_active : !p.is_active);
        const matchTech = matchesTech(p, filterTech);
        return matchCat && matchBrand && matchStatus && matchTech;
      });
      if (!hasProductsForCat) {
        setFilterCat("all");
      }
    }
  };

  const handleTechChange = (newTech: string) => {
    setFilterTech(newTech);
    if (newTech !== "all") {
      if (filterCat !== "all") {
        const hasProductsInCat = products.some(p => {
          const matchCat = (p.category || "addon") === filterCat;
          const matchTech = matchesTech(p, newTech);
          const matchStatus = filterStatus === "all" || (filterStatus === "active" ? p.is_active : !p.is_active);
          return matchCat && matchTech && matchStatus;
        });
        if (!hasProductsInCat) setFilterCat("all");
      }
      if (filterBrand !== "all") {
        const hasProductsInBrand = products.some(p => {
          const matchBrand = isBrandMatch(p, filterBrand);
          const matchTech = matchesTech(p, newTech);
          const matchStatus = filterStatus === "all" || (filterStatus === "active" ? p.is_active : !p.is_active);
          return matchBrand && matchTech && matchStatus;
        });
        if (!hasProductsInBrand) setFilterBrand("all");
      }
    }
  };

  const handleClearAllFilters = () => {
    setSearch("");
    setFilterCat("all");
    setFilterBrand("all");
    setFilterTech("all");
    setFilterStatus("all");
    setSortField(null);
    setSortDirection("asc");
  };

  // Safety fallback effect to prevent stale values
  useEffect(() => {
    if (filterBrand !== "all") {
      const brandFound = availableBrands.some(b => b.name === filterBrand || isBrandMatch({ brand: b.name }, filterBrand));
      if (!brandFound) {
        setFilterBrand("all");
      }
    }
  }, [availableBrands, filterBrand]);

  useEffect(() => {
    if (filterCat !== "all") {
      const catFound = availableCategories.some(c => c.key === filterCat);
      if (!catFound) {
        setFilterCat("all");
      }
    }
  }, [availableCategories, filterCat]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = matchesSearch(p, search);
      const matchCat    = filterCat === "all"    || (p.category || "addon") === filterCat;
      const matchTech   = matchesTech(p, filterTech);
      const matchStatus = filterStatus === "all" || (filterStatus === "active" ? p.is_active : !p.is_active);
      const matchBrand  = filterBrand === "all"  || isBrandMatch(p, filterBrand);
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

  const hasActiveFilters = Boolean(
    search || filterCat !== "all" || filterBrand !== "all" || filterTech !== "all" || filterStatus !== "all" || sortField !== null
  );

  const hasCoreItems = useMemo(() => {
    return Object.keys(MUST_HAVE_CATEGORIES).some(cat => 
      visibleFiltered.some(p => (p.category || "accessories") === cat)
    );
  }, [visibleFiltered]);

  const hasOptionalItems = useMemo(() => {
    return Object.keys(OPTIONAL_CATEGORIES).some(cat => 
      visibleFiltered.some(p => (p.category || "accessories") === cat)
    );
  }, [visibleFiltered]);

  return (
    <div className="space-y-8">

      {/* ── Stats bar ── */}
      <div className="flex flex-wrap gap-4 px-1">
        <Chip label="Total Master Catalog"  value={counts.total}     dot="bg-muted-foreground" />
        <Chip label="Vision Sensors"        value={counts.camera}    dot="bg-primary" />
        <Chip label="Processing Units"      value={counts.recorder}  dot="bg-amber-500" />
        <Chip label="Infrastructure"        value={counts.addons}    dot="bg-teal-500" />
        <Chip label="Active Deployment"     value={counts.active}    dot="bg-success" />
      </div>

      {/* ── Filter bar ── */}
      <Card className="p-4 sm:p-5 sticky top-2 z-20 shadow-md backdrop-blur-md bg-card/95 border-border/80 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary text-foreground">
              <ListFilter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight">Inventory Filters</h3>
              <p className="text-xs text-muted-foreground">
                Showing {filtered.length} of {products.length} SKUs
              </p>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Reset All
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
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

          <select 
            value={filterCat} 
            onChange={(e) => handleCategoryChange(e.target.value)} 
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Categories ({availableCategories.reduce((s, c) => s + c.count, 0)})</option>
            {availableCategories.map(c => (
              <option key={c.key} value={c.key}>{c.label} ({c.count})</option>
            ))}
          </select>

          <select 
            value={filterBrand} 
            onChange={(e) => handleBrandChange(e.target.value)} 
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Brands ({availableBrands.reduce((s, b) => s + b.count, 0)})</option>
            {availableBrands.map(b => (
              <option key={b.name} value={b.name}>{b.name} ({b.count})</option>
            ))}
          </select>

          <select 
            value={filterTech} 
            onChange={(e) => handleTechChange(e.target.value)} 
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Tech ({techCounts.all})</option>
            {techCounts.IP > 0 && <option value="IP">Digital IP System ({techCounts.IP})</option>}
            {techCounts.HD > 0 && <option value="HD">Analog HD System ({techCounts.HD})</option>}
            {techCounts.Wireless > 0 && <option value="Wireless">Smart Wireless (Wi-Fi) ({techCounts.Wireless})</option>}
            {techCounts.both > 0 && <option value="both">Hybrid Tech ({techCounts.both})</option>}
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)} 
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Status ({statusCounts.all})</option>
            <option value="active">Active Deployment ({statusCounts.active})</option>
            <option value="inactive">Off-line / Archive ({statusCounts.inactive})</option>
          </select>

          <select 
            value={sortField ? `${sortField}-${sortDirection}` : "default"} 
            onChange={(e) => {
              const val = e.target.value;
              if (val === "default") {
                setSortField(null);
              } else {
                const [f, d] = val.split("-") as [SortField, SortDirection];
                setSortField(f);
                setSortDirection(d);
              }
            }}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="default">Sort: Default</option>
            <option value="price-asc">Pricing: Low to High (₹ ↑)</option>
            <option value="price-desc">Pricing: High to Low (₹ ↓)</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="brand-asc">Manufacturer: A to Z</option>
            <option value="brand-desc">Manufacturer: Z to A</option>
            <option value="stock-desc">Stock: High to Low</option>
            <option value="status-desc">Status: Active First</option>
            <option value="status-asc">Status: Inactive First</option>
          </select>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground mr-1">Active:</span>
            {search && (
              <Badge variant="secondary" className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-normal">
                Search: &ldquo;{search}&rdquo;
                <button onClick={() => setSearch("")} className="hover:bg-muted rounded p-0.5" title="Remove search filter">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filterCat !== "all" && (
              <Badge variant="secondary" className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-normal">
                Segment: {CATEGORIES[filterCat]?.label || filterCat}
                <button onClick={() => handleCategoryChange("all")} className="hover:bg-muted rounded p-0.5" title="Remove category filter">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filterBrand !== "all" && (
              <Badge variant="secondary" className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-normal">
                Brand: {filterBrand}
                <button onClick={() => handleBrandChange("all")} className="hover:bg-muted rounded p-0.5" title="Remove manufacturer filter">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filterTech !== "all" && (
              <Badge variant="secondary" className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-normal">
                Tech: {filterTech === "IP" ? "Digital IP" : filterTech === "HD" ? "Analog HD" : filterTech === "Wireless" ? "Smart Wireless" : "Hybrid"}
                <button onClick={() => handleTechChange("all")} className="hover:bg-muted rounded p-0.5" title="Remove technology filter">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filterStatus !== "all" && (
              <Badge variant="secondary" className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-normal">
                Status: {filterStatus === "active" ? "Active" : "Off-line"}
                <button onClick={() => setFilterStatus("all")} className="hover:bg-muted rounded p-0.5" title="Remove status filter">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {sortField && (
              <Badge variant="secondary" className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-normal">
                Sort: {
                  sortField === "price" ? (sortDirection === "asc" ? "Pricing: Low to High" : "Pricing: High to Low") :
                  sortField === "name" ? (sortDirection === "asc" ? "Name: A to Z" : "Name: Z to A") :
                  sortField === "brand" ? (sortDirection === "asc" ? "Manufacturer: A to Z" : "Manufacturer: Z to A") :
                  sortField === "stock" ? "Stock: High to Low" :
                  (sortDirection === "desc" ? "Status: Active First" : "Status: Inactive First")
                }
                <button onClick={() => setSortField(null)} className="hover:bg-muted rounded p-0.5" title="Reset sort">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={handleClearAllFilters}
              className="text-xs text-primary hover:underline font-semibold ml-2 py-0.5 cursor-pointer"
            >
              Clear All ({filtered.length} matching)
            </button>
          </div>
        )}
      </Card>

      {/* ── Category groups ── */}
      {filtered.length > 0 && (
        <div>
          {hasCoreItems && (
            <>
              <div className="pt-4 pb-4">
                <h2 className="text-xl font-bold tracking-tight text-primary">
                  Core CCTV Hardware
                </h2>
                <p className="text-sm text-muted-foreground">
                  Essential cameras, recorders, surveillance storage, and power components.
                </p>
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
                    onDuplicate={onDuplicate}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                    onSelectAllGroup={onSelectAllGroup}
                    onDeselectAllGroup={onDeselectAllGroup}
                    onAddProduct={onAddProduct}
                    filterTech={filterTech}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onToggleSort={handleToggleSort}
                  />
                );
              })}
            </>
          )}

          {hasOptionalItems && (
            <>
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
                    onDuplicate={onDuplicate}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                    onSelectAllGroup={onSelectAllGroup}
                    onDeselectAllGroup={onDeselectAllGroup}
                    onAddProduct={onAddProduct}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onToggleSort={handleToggleSort}
                  />
                );
              })}
            </>
          )}
        </div>
      )}

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


