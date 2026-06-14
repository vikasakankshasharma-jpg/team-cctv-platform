"use client";

import { useState, useMemo, useRef } from "react";
import type { Product } from "@/types";
import { Save, Search, Filter, CheckSquare, Square, Zap, Download, Upload } from "lucide-react";
import { manualSpecUpdate } from "@/app/actions/manual-enrichment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

interface ManualEnrichmentClientProps {
  products: Product[];
}

type FilterStatus = "ALL" | "MISSING_SPECS" | "COMPLETED";
type FilterCategory = "ALL" | "CAMERAS" | "RECORDERS";

export function ManualEnrichmentClient({ products }: ManualEnrichmentClientProps) {
  const router = useRouter();
  
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("MISSING_SPECS");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [editedProducts, setEditedProducts] = useState<Record<string, Partial<Product>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Edit State
  const [bulkField, setBulkField] = useState<keyof Product | "">("");
  const [bulkValue, setBulkValue] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.display_name?.toLowerCase().includes(query) || product.technical_name?.toLowerCase().includes(query);
        if (!matchesName) return false;
      }
      if (filterCategory === "CAMERAS" && !product.category?.includes("camera")) return false;
      if (filterCategory === "RECORDERS" && !product.category?.includes("recorder")) return false;

      if (filterStatus === "MISSING_SPECS") {
        if (product.category?.includes("camera")) {
          const missing = !product.resolution_mp || !product.night_vision_type || !product.form_factor;
          if (!missing) return false;
        } else if (product.category?.includes("recorder")) {
          const missing = !product.channels || !product.hdd_slots || !product.max_resolution_rec;
          if (!missing) return false;
        }
      } else if (filterStatus === "COMPLETED") {
         if (product.category?.includes("camera")) {
          const missing = !product.resolution_mp || !product.night_vision_type || !product.form_factor || !product.ip_rating;
          if (missing) return false;
        } else if (product.category?.includes("recorder")) {
          const missing = !product.channels || !product.hdd_slots || !product.max_resolution_rec;
          if (missing) return false;
        }
      }
      return true;
    });
  }, [products, filterStatus, filterCategory, searchQuery]);

  const handleCellChange = (productId: string, field: keyof Product, value: string) => {
    setEditedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const getVal = (product: Product, field: keyof Product) => {
    let val: any;
    if (product.id && editedProducts[product.id]?.[field] !== undefined) {
      val = editedProducts[product.id][field];
    } else {
      val = product[field];
    }
    if (Number.isNaN(val)) return "";
    return val !== undefined && val !== null ? String(val) : "";
  };

  const isChanged = (productId: string) => {
    return !!editedProducts[productId] && Object.keys(editedProducts[productId]).length > 0;
  };

  const changesCount = Object.keys(editedProducts).length;

  const handleSave = async () => {
    if (changesCount === 0) return;
    setIsSaving(true);
    
    try {
      const payload = Object.entries(editedProducts).map(([id, changes]) => ({
        id,
        ...changes
      }));
      
      const result = await manualSpecUpdate(payload);
      toast.success(`Successfully updated ${result.count} products!`);
      setEditedProducts({});
      setSelectedIds(new Set());
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id!)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkApply = () => {
    if (selectedIds.size === 0) {
      toast.error("Select products to bulk edit first.");
      return;
    }
    if (!bulkField) {
      toast.error("Select a field to bulk edit.");
      return;
    }
    
    setEditedProducts(prev => {
      const next = { ...prev };
      selectedIds.forEach(id => {
        next[id] = {
          ...next[id],
          [bulkField]: bulkValue
        };
      });
      return next;
    });
    toast.success(`Applied to ${selectedIds.size} products.`);
  };

  const handleSmartAutoFill = () => {
    let appliedCount = 0;
    
    setEditedProducts(prev => {
      const next = { ...prev };
      
      filteredProducts.forEach(product => {
        if (!product.id) return;
        const name = `${product.display_name || ""} ${product.technical_name || ""}`.toLowerCase();
        const changes: Partial<Product> = { ...next[product.id] };
        let hasChanges = false;

        if (product.category?.includes("camera")) {
          // Resolution
          if (!getVal(product, "resolution_mp") && !changes.resolution_mp) {
            const resMatch = name.match(/\b(1|2|3|4|5|6|8|12|16|24)\s*(mp|megapixel)\b/) || 
                             name.match(/\b(4k)\b/) ? ["8"] : 
                             name.match(/\b(1080p)\b/) ? ["2"] : null;
            if (resMatch) { changes.resolution_mp = Number(resMatch[1] === "4k" ? "8" : resMatch[1] === "1080p" ? "2" : resMatch[1]); hasChanges = true; }
          }
          // Night Vision
          if (!getVal(product, "night_vision_type") && !changes.night_vision_type) {
            if (name.match(/\b(color|full\s*color|colorvu)\b/)) { changes.night_vision_type = "color"; hasChanges = true; }
            else if (name.match(/\b(dual|dual\s*light|smart\s*dual)\b/)) { changes.night_vision_type = "dual_light"; hasChanges = true; }
            else if (name.match(/\b(starlight)\b/)) { changes.night_vision_type = "starlight"; hasChanges = true; }
            else if (name.match(/\b(ir|infrared)\b/)) { changes.night_vision_type = "ir"; hasChanges = true; }
          }
          // Form Factor
          if (!getVal(product, "form_factor") && !changes.form_factor) {
            if (name.match(/\b(dome)\b/)) { changes.form_factor = "dome"; hasChanges = true; }
            else if (name.match(/\b(bullet)\b/)) { changes.form_factor = "bullet"; hasChanges = true; }
            else if (name.match(/\b(ptz)\b/)) { changes.form_factor = "ptz"; hasChanges = true; }
            else if (name.match(/\b(turret)\b/)) { changes.form_factor = "turret"; hasChanges = true; }
            else if (name.match(/\b(fisheye)\b/)) { changes.form_factor = "fisheye"; hasChanges = true; }
          }
          // IP Rating
          if (!getVal(product, "ip_rating") && !changes.ip_rating) {
            const ipMatch = name.match(/\b(ip6[5678])\b/);
            if (ipMatch) { changes.ip_rating = ipMatch[1].toUpperCase(); hasChanges = true; }
            else if (name.match(/\b(indoor)\b/)) { changes.ip_rating = "Indoor"; hasChanges = true; }
          }
        } 
        else if (product.category?.includes("recorder")) {
          // Channels
          if (!getVal(product, "channels") && !changes.channels) {
            const chMatch = name.match(/\b(4|8|16|32|64|128)\s*(ch|channel)\b/) || name.match(/\b(ch|channel)\s*(4|8|16|32|64|128)\b/);
            if (chMatch) { 
               changes.channels = Number(chMatch[1].toLowerCase() === "ch" || chMatch[1].toLowerCase() === "channel" ? chMatch[2] : chMatch[1]); 
               hasChanges = true; 
            }
          }
          // HDD Slots
          if (!getVal(product, "hdd_slots") && !changes.hdd_slots) {
            const hddMatch = name.match(/\b(1|2|4|8|16|24)\s*(sata|hdd)\b/);
            if (hddMatch) { changes.hdd_slots = Number(hddMatch[1]); hasChanges = true; }
          }
          // Max Resolution
          if (!getVal(product, "max_resolution_rec") && !changes.max_resolution_rec) {
            const recMatch = name.match(/\b(4k|8mp|5mp|4mp|3mp|2mp|1080p)\b/);
            if (recMatch) { changes.max_resolution_rec = recMatch[1].toUpperCase(); hasChanges = true; }
          }
        }

        if (hasChanges) {
          next[product.id] = changes;
          appliedCount++;
        }
      });
      
      return next;
    });

    if (appliedCount > 0) {
      toast.success(`Smart Auto-Fill extracted data for ${appliedCount} products! Please review before saving.`);
    } else {
      toast.info("Could not automatically extract any new missing specs from titles.");
    }
  };

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      toast.error("No products to export.");
      return;
    }
    
    const csvData = filteredProducts.map(p => ({
      id: p.id,
      technical_name: p.technical_name,
      display_name: p.display_name,
      category: p.category,
      resolution_mp: p.resolution_mp || "",
      night_vision_type: p.night_vision_type || "",
      form_factor: p.form_factor || "",
      ip_rating: p.ip_rating || "",
      channels: p.channels || "",
      hdd_slots: p.hdd_slots || "",
      max_resolution_rec: p.max_resolution_rec || ""
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filterTag = filterStatus === "MISSING_SPECS" ? "missing_specs" : "specs";
    a.download = `product_${filterTag}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          const payload = rows.filter(r => r.id).map(r => ({
             id: r.id,
             resolution_mp: r.resolution_mp,
             night_vision_type: r.night_vision_type,
             form_factor: r.form_factor,
             ip_rating: r.ip_rating,
             channels: r.channels,
             hdd_slots: r.hdd_slots,
             max_resolution_rec: r.max_resolution_rec
          }));

          if (payload.length === 0) {
            toast.error("No valid products found in CSV.");
            return;
          }

          const result = await manualSpecUpdate(payload);
          toast.success(`Successfully updated ${result.count} products from CSV!`);
          router.refresh();
        } catch (err: any) {
           toast.error(err.message || "Failed to import CSV.");
        } finally {
           setIsSaving(false);
           if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        toast.error(`CSV Parsing Error: ${error.message}`);
        setIsSaving(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
      
      {/* Header & Controls */}
      <div className="p-4 border-b border-border bg-muted/20 flex flex-col justify-between gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-center bg-background border border-border rounded-lg p-1">
              <Filter className="w-4 h-4 text-muted-foreground ml-2 mr-1" />
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="bg-transparent border-none text-sm focus:outline-none py-1 pr-2 cursor-pointer"
              >
                <option value="ALL">All Specs</option>
                <option value="MISSING_SPECS">Missing Specs Only</option>
                <option value="COMPLETED">Completed Only</option>
              </select>
            </div>
            <div className="flex items-center bg-background border border-border rounded-lg p-1">
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
                className="bg-transparent border-none text-sm focus:outline-none py-1 px-2 cursor-pointer"
              >
                <option value="ALL">All Hardware</option>
                <option value="CAMERAS">Cameras Only</option>
                <option value="RECORDERS">Recorders Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSmartAutoFill}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50 transition-colors text-primary"
            >
              <Zap className="w-4 h-4 fill-primary" /> Smart Auto-Fill
            </button>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImportCSV} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50 transition-colors"
            >
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button
              onClick={handleExportCSV}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50 transition-colors"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={handleSave}
              disabled={changesCount === 0 || isSaving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ml-2 ${
                changesCount > 0 
                  ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 active:scale-95" 
                  : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
              }`}
            >
              {isSaving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
              {isSaving ? "Saving..." : `Save Changes (${changesCount})`}
            </button>
          </div>
        </div>

        {/* Bulk Edit Bar */}
        <div className="flex items-center gap-3 p-3 bg-secondary/50 border border-primary/20 rounded-xl">
          <span className="text-sm font-semibold text-primary flex items-center"><Zap className="w-4 h-4 mr-1" /> Bulk Edit</span>
          <div className="flex items-center gap-2 text-sm border-l border-border pl-3">
            <span className="text-muted-foreground">{selectedIds.size} selected</span>
          </div>
          <select 
            className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={bulkField}
            onChange={(e) => setBulkField(e.target.value as keyof Product)}
          >
            <option value="">Select Field...</option>
            <optgroup label="Cameras">
              <option value="resolution_mp">Resolution (MP)</option>
              <option value="night_vision_type">Night Vision Type</option>
              <option value="form_factor">Form Factor</option>
              <option value="ip_rating">IP Rating</option>
            </optgroup>
            <optgroup label="Recorders">
              <option value="channels">Channels</option>
              <option value="hdd_slots">HDD Slots</option>
              <option value="max_resolution_rec">Max Recording Res.</option>
            </optgroup>
          </select>
          <input 
            type="text" 
            placeholder="Value..." 
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button 
            onClick={handleBulkApply}
            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
          >
            Apply to {selectedIds.size} Rows
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur-md shadow-sm">
            <tr>
              <th className="p-3 border-b border-border w-12 text-center">
                <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                  {selectedIds.size > 0 && selectedIds.size === filteredProducts.length ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>
              </th>
              <th className="p-3 font-semibold text-muted-foreground border-b border-border w-64">Product Name</th>
              <th className="p-3 font-semibold text-muted-foreground border-b border-border w-32">Type</th>
              <th className="p-3 font-semibold text-muted-foreground border-b border-border bg-blue-500/5">Res. MP / Max Res</th>
              <th className="p-3 font-semibold text-muted-foreground border-b border-border bg-indigo-500/5">Night Vision</th>
              <th className="p-3 font-semibold text-muted-foreground border-b border-border bg-purple-500/5">Form Factor</th>
              <th className="p-3 font-semibold text-muted-foreground border-b border-border bg-rose-500/5">IP Rating</th>
              <th className="p-3 font-semibold text-muted-foreground border-b border-border bg-amber-500/5">Channels</th>
              <th className="p-3 font-semibold text-muted-foreground border-b border-border bg-emerald-500/5">HDD Slots</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  No products match the current filters.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const isCamera = product.category?.includes("camera");
                const isRecorder = product.category?.includes("recorder");
                const rowChanged = isChanged(product.id!);
                const isSelected = selectedIds.has(product.id!);
                
                return (
                  <tr key={product.id} className={`hover:bg-muted/20 transition-colors ${rowChanged ? 'bg-primary/5' : ''} ${isSelected ? 'bg-secondary/30' : ''}`}>
                    <td className="p-3 text-center">
                      <button onClick={() => toggleSelect(product.id!)} className="text-muted-foreground hover:text-foreground">
                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {rowChanged && <div className="w-1.5 h-1.5 rounded-full bg-primary" title="Unsaved changes" />}
                        <div className="truncate max-w-[250px] font-medium" title={product.display_name}>
                          {product.display_name}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[250px]" title={product.technical_name}>
                        {product.technical_name}
                      </div>
                    </td>
                    <td className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {isCamera ? "Camera" : isRecorder ? "Recorder" : "Other"}
                    </td>
                    
                    {/* Resolution / Max Res */}
                    <td className="p-2 bg-blue-500/5">
                      <input 
                        type="text" 
                        value={isRecorder ? getVal(product, "max_resolution_rec") : getVal(product, "resolution_mp")}
                        onChange={(e) => handleCellChange(product.id!, isRecorder ? "max_resolution_rec" : "resolution_mp", e.target.value)}
                        placeholder={isCamera ? "e.g. 2, 4, 5" : isRecorder ? "e.g. 4K, 5MP" : "-"}
                        disabled={!isCamera && !isRecorder}
                        className="w-full bg-transparent border border-transparent hover:border-border focus:bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-2 py-1 text-sm transition-all"
                      />
                    </td>

                    {/* Night Vision */}
                    <td className="p-2 bg-indigo-500/5">
                      <select 
                        value={getVal(product, "night_vision_type")}
                        onChange={(e) => handleCellChange(product.id!, "night_vision_type", e.target.value)}
                        disabled={!isCamera}
                        className="w-full bg-transparent border border-transparent hover:border-border focus:bg-background focus:border-primary focus:outline-none rounded px-1 py-1 text-sm text-foreground transition-all"
                      >
                        <option value="">-</option>
                        <option value="ir">IR</option>
                        <option value="color">Full Color</option>
                        <option value="dual_light">Dual Light</option>
                        <option value="starlight">Starlight</option>
                      </select>
                    </td>

                    {/* Form Factor */}
                    <td className="p-2 bg-purple-500/5">
                      <select 
                        value={getVal(product, "form_factor")}
                        onChange={(e) => handleCellChange(product.id!, "form_factor", e.target.value)}
                        disabled={!isCamera}
                        className="w-full bg-transparent border border-transparent hover:border-border focus:bg-background focus:border-primary focus:outline-none rounded px-1 py-1 text-sm text-foreground transition-all"
                      >
                        <option value="">-</option>
                        <option value="dome">Dome</option>
                        <option value="bullet">Bullet</option>
                        <option value="ptz">PTZ</option>
                        <option value="turret">Turret</option>
                        <option value="fisheye">Fisheye</option>
                      </select>
                    </td>

                    {/* IP Rating */}
                    <td className="p-2 bg-rose-500/5">
                      <input 
                        type="text" 
                        value={getVal(product, "ip_rating")}
                        onChange={(e) => handleCellChange(product.id!, "ip_rating", e.target.value)}
                        placeholder={isCamera ? "e.g. IP67, Indoor" : "-"}
                        disabled={!isCamera}
                        className="w-full bg-transparent border border-transparent hover:border-border focus:bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-2 py-1 text-sm transition-all"
                      />
                    </td>

                    {/* Channels */}
                    <td className="p-2 bg-amber-500/5">
                      <input 
                        type="text" 
                        value={getVal(product, "channels")}
                        onChange={(e) => handleCellChange(product.id!, "channels", e.target.value)}
                        placeholder={isRecorder ? "e.g. 4, 8, 16" : "-"}
                        disabled={!isRecorder}
                        className="w-full bg-transparent border border-transparent hover:border-border focus:bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-2 py-1 text-sm transition-all"
                      />
                    </td>

                    {/* HDD Bays */}
                    <td className="p-2 bg-emerald-500/5">
                      <input 
                        type="text" 
                        value={getVal(product, "hdd_slots")}
                        onChange={(e) => handleCellChange(product.id!, "hdd_slots", e.target.value)}
                        placeholder={isRecorder ? "e.g. 1, 2, 4" : "-"}
                        disabled={!isRecorder}
                        className="w-full bg-transparent border border-transparent hover:border-border focus:bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-2 py-1 text-sm transition-all"
                      />
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

