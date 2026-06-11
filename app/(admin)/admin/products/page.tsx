"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";
import { Loader2, Plus, Save, X, Package, IndianRupee, BadgeDollarSign, Camera, Info, Settings, Tag, Target, HardDrive, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ProductInventory } from "@/components/admin/ProductInventory";
import { ProductsSkeleton } from "@/components/admin/ProductsSkeleton";
import { BackButton } from "@/components/admin/BackButton";
import { BulkImportExport } from "@/components/admin/BulkImportExport";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { CategoryGroupSelector } from "@/components/admin/CategoryGroupSelector";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featureTags, setFeatureTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active filters â€” kept in sync with ProductInventory for intelligent export
  const [activeFilters, setActiveFilters] = useState<{ category: string; technology: string }>({
    category: "",
    technology: "",
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "specs" | "pricing" | "marketing">("basic");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, tagRes] = await Promise.all([
        fetch(`/api/admin/products?_t=${Date.now()}`),
        fetch(`/api/admin/features?_t=${Date.now()}`)
      ]);
      const prodData = await prodRes.json();
      const tagData = await tagRes.json();
      
      if (prodData.success) setProducts(prodData.products);
      if (tagData.success) setFeatureTags(tagData.tags);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load catalog data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/admin/products?_t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Failed to load catalog");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAllGroup = (ids: string[]) => {
    const newSet = new Set(selectedIds);
    ids.forEach(id => newSet.add(id));
    setSelectedIds(newSet);
  };

  const handleDeselectAllGroup = (ids: string[]) => {
    const newSet = new Set(selectedIds);
    ids.forEach(id => newSet.delete(id));
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} products?`)) return;

    const ids = Array.from(selectedIds).join(",");
    try {
      const res = await fetch(`/api/admin/products?ids=${ids}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Products deleted successfully");
        setSelectedIds(new Set());
        fetchProducts();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error("Failed to delete products");
    }
  };

  const handleToggleActive = async (product: Product) => {
    const id = product.id!;
    const currentStatus = product.is_active;
    try {
      // Optimistic update
      setProducts(products.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
      
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentStatus })
      });
      
      if (!res.ok) throw new Error("Update failed");
      toast.success(currentStatus ? "Marked Out of Stock" : "Marked In Stock");
    } catch (error) {
      // Revert optimistic update
      setProducts(products.map(p => p.id === id ? { ...p, is_active: currentStatus } : p));
      toast.error("Failed to update status");
    }
  };

  const handleEdit = (product: Product) => {
    const p = { ...product };
    
    // Auto-fill missing specific specs from title or technologies for backwards compatibility
    if (p.category === 'rack' && !p.rack_u_height) {
      const match = p.display_name?.toLowerCase().match(/(\d+)\s*u\b/);
      if (match) p.rack_u_height = parseInt(match[1]);
      else if (p.technologies?.some(t => t.toLowerCase().endsWith('u'))) {
        const uTech = p.technologies.find(t => t.toLowerCase().endsWith('u'));
        if (uTech) p.rack_u_height = parseInt(uTech);
      }
    }
    if (p.category === 'cable' && !p.cable_length_m) {
      const match = p.display_name?.toLowerCase().match(/(\d+)\s*(?:m|meter|meters)\b/);
      if (match) p.cable_length_m = parseInt(match[1]);
    }
    if (p.category === 'power_device') {
      if (!p.power_voltage_v) {
        const match = p.display_name?.match(/\b(\d+(?:\.\d+)?)\s*v\b/i);
        if (match) p.power_voltage_v = parseFloat(match[1]);
      }
      if (!p.power_amperage_a) {
        const match = p.display_name?.match(/\b(\d+(?:\.\d+)?)\s*a\b/i);
        if (match) p.power_amperage_a = parseFloat(match[1]);
      }
      if (!p.power_wattage_w) {
        const match = p.display_name?.match(/\b(\d+(?:\.\d+)?)\s*w\b/i);
        if (match) p.power_wattage_w = parseFloat(match[1]);
      }
    }

    setEditingProduct(p);
    setActiveTab("basic");
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct({
      display_name: "",
      technical_name: "",
      brand: "",
      category: "cctv_camera",
      technologies: ["HD"],
      is_active: true,
      base_cost: 0,
      margin_percentage: 15,
      unit_price: 0,
      stock_quantity: 100
    });
    setActiveTab("basic");
    setIsModalOpen(true);
  };

  // Auto-calculate daily GB per camera based on resolution and compression
  const calculateDailyStorage = (resMp?: number, compression?: string) => {
    if (!resMp) return undefined;
    // Base heuristic: 2MP H.264 â‰ˆ 25GB/day. H.265 saves ~50%.
    const baseGB = resMp * 10; // rough baseline
    if (compression === "H.265" || compression === "H.265+") {
      return Math.round(baseGB * 0.5);
    }
    return Math.round(baseGB);
  };

  // Update storage whenever relevant fields change
  useEffect(() => {
    if (editingProduct && editingProduct.category === "cctv_camera" && editingProduct.resolution_mp) {
      const estimated = calculateDailyStorage(editingProduct.resolution_mp, editingProduct.compression);
      if (estimated && estimated !== editingProduct.daily_gb_per_camera) {
        setEditingProduct(prev => ({ ...prev, daily_gb_per_camera: estimated }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProduct?.resolution_mp, editingProduct?.compression, editingProduct?.category]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsSaving(true);
    try {
      const isNew = !editingProduct.id;
      const method = isNew ? "POST" : "PATCH";
      
      // Auto calc unit price based on cost + margin before sending
      const payload = { ...editingProduct };
      if (payload.base_cost !== undefined && payload.margin_percentage !== undefined) {
        payload.unit_price = Math.round(Number(payload.base_cost) + (Number(payload.base_cost) * (Number(payload.margin_percentage) / 100)));
      }

      // Auto-generate technical_name from display_name if empty
      if (!payload.technical_name && payload.display_name) {
        payload.technical_name = payload.display_name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, "_")
          .substring(0, 80);
      }

      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      toast.success(isNew ? "Product Added Successfully" : "Product Updated");
      setIsModalOpen(false);
      fetchProducts(); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error("Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Identity", icon: <Info className="w-4 h-4" /> },
    { id: "specs", label: "Specs", icon: <Settings className="w-4 h-4" /> },
    { id: "pricing", label: "Pricing", icon: <Tag className="w-4 h-4" /> },
    { id: "marketing", label: "Marketing", icon: <Target className="w-4 h-4" /> }
  ] as const;

  return (
    <div className="bg-background min-h-screen pb-24 transition-colors duration-500">
      {/* â”€â”€ Page Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <BackButton />
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">Operational Real-time</span>
              </div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                Hardware Management
              </h1>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">
                 Inventory Control & Price Engine Configuration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <BulkImportExport
               activeFilters={activeFilters}
               onImportSuccess={fetchProducts}
             />

             {selectedIds.size > 0 && (
               <button
                 onClick={handleDeleteSelected}
                 className="flex items-center gap-2 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-full text-xs font-semibold hover:bg-destructive/90 transition-all shadow-sm"
               >
                 <Trash2 className="w-4 h-4" />
                 Delete ({selectedIds.size})
               </button>
             )}

             <div className="w-px h-8 bg-border" />

             <a
               href="/admin/products/enrich"
               className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold transition-all shadow-sm active:scale-95"
             >
               <Sparkles className="w-4 h-4" />
               AI Enrich
             </a>

             <button
               onClick={handleAdd}
               className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm active:scale-95"
             >
               <Plus className="w-4 h-4" />
               New Product
             </button>
          </div>
        </div>
      </header>

      {/* â”€â”€ Main Content Area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {isLoading ? (
          <ProductsSkeleton />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ProductInventory
              products={products}
              onEdit={handleEdit}
              onToggle={handleToggleActive}
              onFiltersChange={setActiveFilters}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAllGroup={handleSelectAllGroup}
              onDeselectAllGroup={handleDeselectAllGroup}
            />
          </div>
        )}
      </main>

      {/* â”€â”€ Premium Modal Interface (Tabbed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col border border-border overflow-hidden">
            
            {/* Modal Header & Tabs */}
            <div className="bg-card border-b border-border shrink-0">
              <div className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                    {editingProduct.category === "cctv_camera" ? <Camera className="w-5 h-5" /> : 
                     editingProduct.category === "recorder" ? <HardDrive className="w-5 h-5" /> :
                     <Package className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground tracking-tight">
                      {editingProduct.id ? "Edit Product" : "New Product"}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">SKU:</span>
                       <code className="text-xs font-mono font-medium text-foreground">{editingProduct.technical_name || "PENDING"}</code>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="px-6 flex gap-6">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all border-b-2 ${
                      activeTab === tab.id 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-card">
              <form id="product-form" onSubmit={handleSave} className="max-w-3xl">
                
                {/* â”€â”€ TAB 1: BASIC IDENTITY â”€â”€ */}
                {activeTab === "basic" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* Media Upload */}
                    <ImageUploader 
                      value={editingProduct.image_url || null}
                      onChange={(url) => setEditingProduct({ ...editingProduct, image_url: url || undefined })}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Commercial Label *</label>
                        <input 
                          required
                          type="text" 
                          value={editingProduct.display_name || ""}
                          onChange={e => setEditingProduct({...editingProduct, display_name: e.target.value})}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="e.g. 5MP Full Color Night Vision IP Camera"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Brand</label>
                        <input 
                          type="text" 
                          value={editingProduct.brand || ""}
                          onChange={e => setEditingProduct({...editingProduct, brand: e.target.value})}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="e.g. Hikvision"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Category</label>
                        <select 
                          value={editingProduct.category || "cctv_camera"}
                          onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        >
                          <option value="cctv_camera">Camera</option>
                          <option value="recorder">Recorder Unit</option>
                          <option value="accessories">Hardware Accessory</option>
                          <option value="cable">Transmission Line</option>
                          <option value="storage">Storage / HDD</option>
                          <option value="power_device">Power Supply / UPS</option>
                          <option value="network">Network & Switches</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Technology</label>
                        <select 
                          value={editingProduct.technologies?.[0] || "Common"}
                          onChange={e => setEditingProduct({...editingProduct, technologies: [e.target.value as any]})}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        >
                          <option value="HD">Analog HD</option>
                          <option value="IP">Digital IP</option>
                          <option value="both">Hybrid / Common</option>
                          <option value="WiFi">WiFi</option>
                        </select>
                      </div>
                      {/* Tally-Style Group Selector */}
                      <CategoryGroupSelector
                        value={editingProduct.group_id || null}
                        onChange={(groupId, fullPath) => setEditingProduct({...editingProduct, group_id: groupId, group_path: fullPath})}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Technical SKU</label>
                        <input 
                          type="text" 
                          value={editingProduct.technical_name || ""}
                          onChange={e => setEditingProduct({...editingProduct, technical_name: e.target.value})}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                          placeholder="e.g. hikvision_2mp_colorvu_dome"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Stock Quantity</label>
                        <input 
                          type="number" 
                          value={editingProduct.stock_quantity !== undefined ? editingProduct.stock_quantity : ""}
                          onChange={e => setEditingProduct({...editingProduct, stock_quantity: e.target.value ? Number(e.target.value) : 0})}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Current stock level"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* â”€â”€ TAB 2: TECHNICAL SPECS â”€â”€ */}
                {activeTab === "specs" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {editingProduct.category === "cctv_camera" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Resolution (MP)</label>
                          <input 
                            type="number" 
                            value={editingProduct.resolution_mp || ""}
                            onChange={e => setEditingProduct({...editingProduct, resolution_mp: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Compression</label>
                          <select 
                            value={editingProduct.compression || "H.265"}
                            onChange={e => setEditingProduct({...editingProduct, compression: e.target.value as any})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                          >
                            <option value="H.264">H.264</option>
                            <option value="H.265">H.265</option>
                            <option value="H.265+">H.265+</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-emerald-500 uppercase tracking-wider ml-1">Auto-Storage (GB/Day)</label>
                          <input 
                            readOnly
                            type="number" 
                            value={editingProduct.daily_gb_per_camera || ""}
                            className="flex h-10 w-full rounded-md border border-input bg-emerald-500/10 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-emerald-600"
                            placeholder="Calculated automatically"
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Night Vision Type</label>
                          <select 
                            value={editingProduct.night_vision_type || "ir"}
                            onChange={e => setEditingProduct({...editingProduct, night_vision_type: e.target.value as any})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                          >
                            <option value="ir">IR (B&W)</option>
                            <option value="color">Full Color</option>
                            <option value="dual_light">Dual Light</option>
                            <option value="starlight">Starlight</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">NV Range (m)</label>
                          <input 
                            type="number" 
                            value={editingProduct.night_vision_range_m || ""}
                            onChange={e => setEditingProduct({...editingProduct, night_vision_range_m: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Form Factor</label>
                          <select 
                            value={editingProduct.form_factor || "dome"}
                            onChange={e => setEditingProduct({...editingProduct, form_factor: e.target.value as any})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                          >
                            <option value="dome">Dome</option>
                            <option value="bullet">Bullet</option>
                            <option value="ptz">PTZ</option>
                            <option value="turret">Turret</option>
                          </select>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Lens (mm)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={editingProduct.lens_mm || ""}
                            onChange={e => setEditingProduct({...editingProduct, lens_mm: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. 2.8"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Viewing Angle (Â°)</label>
                          <input 
                            type="number" 
                            value={editingProduct.viewing_angle_deg || ""}
                            onChange={e => setEditingProduct({...editingProduct, viewing_angle_deg: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. 110"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">IP Rating</label>
                          <select 
                            value={editingProduct.ip_rating || "Indoor"}
                            onChange={e => setEditingProduct({...editingProduct, ip_rating: e.target.value})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                          >
                            <option value="Indoor">Indoor Only</option>
                            <option value="IP65">IP65</option>
                            <option value="IP66">IP66</option>
                            <option value="IP67">IP67</option>
                          </select>
                        </div>
                        <div className="space-y-1.5 col-span-1 md:col-span-3">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">AI Analytics Features (comma separated)</label>
                          <input 
                            type="text" 
                            value={editingProduct.ai_features?.join(", ") || ""}
                            onChange={e => setEditingProduct({...editingProduct, ai_features: e.target.value ? e.target.value.split(",").map(s => s.trim()) : undefined})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. person_detect, vehicle_detect, face_detect"
                          />
                        </div>
                        
                        {/* Toggles */}
                        <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                          <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/50">
                            <input type="checkbox" checked={!!editingProduct.has_audio} onChange={e => setEditingProduct({...editingProduct, has_audio: e.target.checked})} className="w-4 h-4 rounded border-input accent-primary" />
                            <span className="text-xs font-semibold text-foreground">Audio Mic</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/50">
                            <input type="checkbox" checked={!!editingProduct.wdr} onChange={e => setEditingProduct({...editingProduct, wdr: e.target.checked})} className="w-4 h-4 rounded border-input accent-primary" />
                            <span className="text-xs font-semibold text-foreground">WDR</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/50">
                            <input type="checkbox" checked={!!editingProduct.poe} onChange={e => setEditingProduct({...editingProduct, poe: e.target.checked})} className="w-4 h-4 rounded border-input accent-primary" />
                            <span className="text-xs font-semibold text-foreground">PoE Support</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/50">
                            <input type="checkbox" checked={!!editingProduct.has_sd_slot} onChange={e => setEditingProduct({...editingProduct, has_sd_slot: e.target.checked})} className="w-4 h-4 rounded border-input accent-primary" />
                            <span className="text-xs font-semibold text-foreground">SD Slot</span>
                          </label>
                        </div>

                        {/* Special Features / Wizard Tags */}
                        <div className="col-span-1 md:col-span-3 mt-4 p-4 border border-border rounded-xl bg-muted/20">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Special Features / Wizard Tags</label>
                          <div className="flex flex-wrap gap-2">
                            {["color", "audio", "ptz", "solar", "4g"].map(feat => (
                              <label key={feat} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${editingProduct.features?.includes(feat) ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-foreground hover:bg-muted'}`}>
                                <input 
                                  type="checkbox" 
                                  className="sr-only"
                                  checked={editingProduct.features?.includes(feat) || false}
                                  onChange={e => {
                                    const current = editingProduct.features || [];
                                    if (e.target.checked) {
                                      setEditingProduct({ ...editingProduct, features: [...current, feat] });
                                    } else {
                                      setEditingProduct({ ...editingProduct, features: current.filter(f => f !== feat) });
                                    }
                                  }}
                                />
                                <span className="text-xs font-semibold capitalize">{feat === "4g" ? "4G / SIM" : feat}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2">These tags are used by the pricing engine to filter products during the wizard flow.</p>
                        </div>
                      </div>
                    )}

                    {editingProduct.category === "recorder" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Channels</label>
                          <select 
                            value={editingProduct.channels || 4}
                            onChange={e => setEditingProduct({...editingProduct, channels: Number(e.target.value)})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                          >
                            <option value={4}>4 Channels</option>
                            <option value={8}>8 Channels</option>
                            <option value={16}>16 Channels</option>
                            <option value={32}>32 Channels</option>
                            <option value={64}>64 Channels</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Max Cameras Supported</label>
                          <input 
                            type="number" 
                            value={editingProduct.max_cameras || editingProduct.channels || 4}
                            onChange={e => setEditingProduct({...editingProduct, max_cameras: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Resolution Tier</label>
                          <select 
                            value={editingProduct.resolution_tier || "good"}
                            onChange={e => setEditingProduct({...editingProduct, resolution_tier: e.target.value as any})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                          >
                            <option value="good">Up to 2MP</option>
                            <option value="very_clear">Up to 5MP</option>
                            <option value="crystal_clear">Up to 8MP (4K)</option>
                          </select>
                        </div>
                      </div>
                    )}
                    
                    {editingProduct.category === "rack" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">U Height</label>
                          <select 
                            value={editingProduct.rack_u_height || ""}
                            onChange={e => setEditingProduct({...editingProduct, rack_u_height: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                          >
                            <option value="">Select U-Height...</option>
                            {[2, 4, 6, 9, 12, 15, 18, 22, 24, 27, 32, 42].map(u => <option key={u} value={u}>{u}U</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {editingProduct.category === "cable" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Cable Type</label>
                          <input 
                            type="text" 
                            value={editingProduct.cable_type || ""}
                            onChange={e => setEditingProduct({...editingProduct, cable_type: e.target.value})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            placeholder="e.g. Cat6, 3+1 CCTV, Fiber"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Length (Meters)</label>
                          <input 
                            type="number" 
                            value={editingProduct.cable_length_m || ""}
                            onChange={e => setEditingProduct({...editingProduct, cable_length_m: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            placeholder="e.g. 90, 305"
                          />
                        </div>
                      </div>
                    )}

                    {editingProduct.category === "storage" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Storage Type</label>
                          <select 
                            value={editingProduct.storage_type || ""}
                            onChange={e => setEditingProduct({...editingProduct, storage_type: e.target.value})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background appearance-none"
                          >
                            <option value="">Select Type...</option>
                            <option value="Surveillance HDD">Surveillance HDD</option>
                            <option value="SSD">SSD</option>
                            <option value="MicroSD">MicroSD</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Capacity (TB)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={editingProduct.storage_capacity_tb || ""}
                            onChange={e => setEditingProduct({...editingProduct, storage_capacity_tb: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            placeholder="e.g. 1, 2, 4, 8"
                          />
                        </div>
                      </div>
                    )}

                    {editingProduct.category === "power_device" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Output Voltage (V)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={editingProduct.power_voltage_v || ""}
                            onChange={e => setEditingProduct({...editingProduct, power_voltage_v: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            placeholder="e.g. 12, 24"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Amperage (A)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={editingProduct.power_amperage_a || ""}
                            onChange={e => setEditingProduct({...editingProduct, power_amperage_a: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            placeholder="e.g. 1.7, 5, 10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Wattage (W)</label>
                          <input 
                            type="number" 
                            step="1"
                            value={editingProduct.power_wattage_w || ""}
                            onChange={e => setEditingProduct({...editingProduct, power_wattage_w: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            placeholder="e.g. 60, 120"
                          />
                        </div>
                      </div>
                    )}

                    {editingProduct.category === "network" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Total Ports</label>
                          <input 
                            type="number" 
                            value={editingProduct.network_ports || ""}
                            onChange={e => setEditingProduct({...editingProduct, network_ports: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            placeholder="e.g. 4, 8, 16, 24"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Speed</label>
                          <select 
                            value={editingProduct.network_speed || ""}
                            onChange={e => setEditingProduct({...editingProduct, network_speed: e.target.value})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background appearance-none"
                          >
                            <option value="">Select Speed...</option>
                            <option value="10/100 Mbps">10/100 Mbps</option>
                            <option value="Gigabit">Gigabit (10/100/1000)</option>
                            <option value="10G">10G</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {!["cctv_camera", "recorder", "rack", "cable", "storage", "network"].includes(editingProduct.category || "") && (
                      <div className="p-10 border border-dashed border-border rounded-2xl text-center">
                        <p className="text-muted-foreground text-sm font-medium">No specific technical attributes for this category.</p>
                      </div>
                    )}

                    {/* â”€â”€ Dynamic Custom Specifications â”€â”€ */}
                    <div className="pt-6 mt-6 border-t border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">Custom Specifications</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Add arbitrary key-value pairs for this product (e.g. Color, Material, Thread Size).</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const current = editingProduct.custom_attributes || [];
                            setEditingProduct({
                              ...editingProduct,
                              custom_attributes: [...current, { key: "", value: "" }]
                            });
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Field
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(editingProduct.custom_attributes || []).map((attr, index) => (
                          <div key={index} className="flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex-1 space-y-1.5">
                              <input
                                type="text"
                                value={attr.key}
                                onChange={e => {
                                  const newAttrs = [...(editingProduct.custom_attributes || [])];
                                  newAttrs[index] = { ...newAttrs[index], key: e.target.value };
                                  setEditingProduct({ ...editingProduct, custom_attributes: newAttrs });
                                }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background font-medium"
                                placeholder="Attribute Name (e.g. Color)"
                              />
                            </div>
                            <div className="flex-[2] space-y-1.5">
                              <input
                                type="text"
                                value={attr.value}
                                onChange={e => {
                                  const newAttrs = [...(editingProduct.custom_attributes || [])];
                                  newAttrs[index] = { ...newAttrs[index], value: e.target.value };
                                  setEditingProduct({ ...editingProduct, custom_attributes: newAttrs });
                                }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                placeholder="Value (e.g. Matte Black)"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newAttrs = [...(editingProduct.custom_attributes || [])];
                                newAttrs.splice(index, 1);
                                setEditingProduct({ ...editingProduct, custom_attributes: newAttrs });
                              }}
                              className="w-10 h-10 shrink-0 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {(!editingProduct.custom_attributes || editingProduct.custom_attributes.length === 0) && (
                          <div className="p-6 border border-dashed border-border rounded-xl text-center bg-muted/20">
                            <p className="text-muted-foreground text-xs font-medium">No custom specifications added yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* â”€â”€ TAB 3: PRICING ENGINE â”€â”€ */}
                {activeTab === "pricing" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-secondary/50 rounded-2xl p-6 border border-border">
                      <div className="flex items-center gap-2 mb-4">
                        <BadgeDollarSign className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">Cost-Plus Engine</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Base Cost (₹)</label>
                          <input 
                            required
                            type="number" 
                            value={editingProduct.base_cost !== undefined ? editingProduct.base_cost : ""}
                            onChange={e => setEditingProduct({...editingProduct, base_cost: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Margin (%)</label>
                          <input 
                            required
                            type="number" 
                            value={editingProduct.margin_percentage !== undefined ? editingProduct.margin_percentage : ""}
                            onChange={e => setEditingProduct({...editingProduct, margin_percentage: e.target.value ? Number(e.target.value) : undefined})}
                            className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                          />
                        </div>
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                          <label className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">Final Retail</label>
                          <div className="text-xl font-bold text-primary tabular-nums tracking-tight">
                            ₹ {
                              (editingProduct.base_cost !== undefined && editingProduct.margin_percentage !== undefined)
                                ? Math.round(Number(editingProduct.base_cost) + (Number(editingProduct.base_cost) * (Number(editingProduct.margin_percentage) / 100))).toLocaleString('en-IN')
                                : "0"
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bulk Volume Logic */}
                    <div className="p-6 bg-card border border-border rounded-2xl">
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-foreground">Volume Discounts</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">Apply automated discounts for large scale deployments</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Threshold (Count)</label>
                          <input 
                            type="number" 
                            value={editingProduct.bulk_discount_threshold || ""}
                            onChange={e => setEditingProduct({...editingProduct, bulk_discount_threshold: e.target.value ? Number(e.target.value) : undefined})}
                            placeholder="e.g. 8"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Bulk Unit Price (₹)</label>
                          <input 
                            type="number" 
                            value={editingProduct.bulk_unit_price || ""}
                            onChange={e => setEditingProduct({...editingProduct, bulk_unit_price: e.target.value ? Number(e.target.value) : undefined})}
                            placeholder="Discounted price"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* â”€â”€ TAB 4: MARKETING â”€â”€ */}
                {activeTab === "marketing" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-semibold text-amber-600">Silent Margin Boost</h4>
                          <p className="text-xs font-medium text-amber-600/70 mt-0.5">Force the engine to recommend this product.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={!!editingProduct.is_focus_product} onChange={e => setEditingProduct({...editingProduct, is_focus_product: e.target.checked})} className="sr-only peer" />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {editingProduct.is_focus_product && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-amber-500/20">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-amber-600/80 uppercase tracking-wider ml-1">Boost Priority (1-100)</label>
                            <input 
                              type="number" 
                              value={editingProduct.focus_boost_priority || ""}
                              onChange={e => setEditingProduct({...editingProduct, focus_boost_priority: e.target.value ? Number(e.target.value) : undefined})}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="e.g. 90"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-amber-600/80 uppercase tracking-wider ml-1">Internal Reason</label>
                            <input 
                              type="text" 
                              value={editingProduct.focus_reason || ""}
                              onChange={e => setEditingProduct({...editingProduct, focus_reason: e.target.value})}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="e.g. Overstocked inventory"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-card flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-sm font-semibold shadow-sm disabled:opacity-50 transition-colors"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
