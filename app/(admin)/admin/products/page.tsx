"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";
import { Loader2, Plus, Save, X, Package, IndianRupee, BadgeDollarSign, Camera, Info, Settings, Tag, Target, HardDrive } from "lucide-react";
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

  // Active filters — kept in sync with ProductInventory for intelligent export
  const [activeFilters, setActiveFilters] = useState<{ category: string; technology: string }>({
    category: "",
    technology: "",
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "specs" | "pricing" | "marketing">("basic");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, tagRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/features")
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
      const res = await fetch("/api/admin/products");
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
    setEditingProduct({ ...product });
    setActiveTab("basic");
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct({
      display_name: "",
      technical_name: "",
      brand: "",
      category: "camera",
      technology: "HD",
      is_active: true,
      base_cost: 0,
      margin_percentage: 15,
      unit_price: 0
    });
    setActiveTab("basic");
    setIsModalOpen(true);
  };

  // Auto-calculate daily GB per camera based on resolution and compression
  const calculateDailyStorage = (resMp?: number, compression?: string) => {
    if (!resMp) return undefined;
    // Base heuristic: 2MP H.264 ≈ 25GB/day. H.265 saves ~50%.
    const baseGB = resMp * 10; // rough baseline
    if (compression === "H.265" || compression === "H.265+") {
      return Math.round(baseGB * 0.5);
    }
    return Math.round(baseGB);
  };

  // Update storage whenever relevant fields change
  useEffect(() => {
    if (editingProduct && editingProduct.category === "camera" && editingProduct.resolution_mp) {
      const estimated = calculateDailyStorage(editingProduct.resolution_mp, editingProduct.compression);
      if (estimated && estimated !== editingProduct.daily_gb_per_camera) {
        setEditingProduct(prev => ({ ...prev, daily_gb_per_camera: estimated }));
      }
    }
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
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen pb-24 transition-colors duration-500">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800 shadow-sm transition-all duration-500">
        <div className="max-w-[1600px] mx-auto px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <BackButton />
            <div className="w-14 h-14 rounded-[22px] bg-zinc-900 dark:bg-white flex items-center justify-center shadow-md shadow-zinc-900/20 dark:shadow-white/5 group hover:rotate-3 transition-transform duration-500">
              <Package className="w-6 h-6 text-white dark:text-zinc-900" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                 <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.3em]">Operational Real-time</span>
              </div>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                Hardware Management Suite
              </h1>
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-2 uppercase tracking-widest">
                 Inventory Control & Price Engine Configuration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Bulk Export / Import */}
             <BulkImportExport
               activeFilters={activeFilters}
               onImportSuccess={fetchProducts}
             />

             <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />

             <button
               onClick={handleAdd}
               className="flex items-center gap-3 px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-md shadow-zinc-900/20 active:scale-95 group whitespace-nowrap"
             >
               <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
               Register New Hardware
             </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto px-8 py-12">
        {isLoading ? (
          <ProductsSkeleton />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ProductInventory
              products={products}
              onEdit={handleEdit}
              onToggle={handleToggleActive}
              onFiltersChange={setActiveFilters}
            />
          </div>
        )}
      </main>

      {/* ── Premium Modal Interface (Tabbed) ────────────────────────────── */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900 dark:bg-black animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md w-full max-w-5xl max-h-[90vh] flex flex-col border border-zinc-200/50 dark:border-zinc-800 overflow-hidden">
            
            {/* Modal Header & Tabs */}
            <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center justify-between px-8 py-6">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-zinc-400">
                    {editingProduct.category === "camera" ? <Camera className="w-5 h-5" /> : 
                     editingProduct.category === "recorder" ? <HardDrive className="w-5 h-5" /> :
                     <Package className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                      {editingProduct.id ? "Hardware Matrix Override" : "Inventory Onboarding"}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">SKU:</span>
                       <code className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">{editingProduct.technical_name || "PENDING"}</code>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="px-8 flex gap-8">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                      activeTab === tab.id 
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 bg-white dark:bg-zinc-900">
              <form id="product-form" onSubmit={handleSave} className="max-w-3xl">
                
                {/* ── TAB 1: BASIC IDENTITY ── */}
                {activeTab === "basic" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    
                    {/* Media Upload */}
                    <ImageUploader 
                      value={editingProduct.image_url || null}
                      onChange={(url) => setEditingProduct({ ...editingProduct, image_url: url || undefined })}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Commercial Label *</label>
                        <input 
                          required
                          type="text" 
                          value={editingProduct.display_name || ""}
                          onChange={e => setEditingProduct({...editingProduct, display_name: e.target.value})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                          placeholder="e.g. 5MP Full Color Night Vision IP Camera"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Brand</label>
                        <input 
                          type="text" 
                          value={editingProduct.brand || ""}
                          onChange={e => setEditingProduct({...editingProduct, brand: e.target.value})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                          placeholder="e.g. Hikvision"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Category</label>
                        <select 
                          value={editingProduct.category || "camera"}
                          onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none cursor-pointer"
                        >
                          <option value="camera">Camera</option>
                          <option value="recorder">Recorder Unit</option>
                          <option value="accessory">Hardware Accessory</option>
                          <option value="cable">Transmission Line</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Technology</label>
                        <select 
                          value={editingProduct.technology || "both"}
                          onChange={e => setEditingProduct({...editingProduct, technology: e.target.value as any})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none cursor-pointer"
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

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Technical SKU</label>
                      <input 
                        type="text" 
                        value={editingProduct.technical_name || ""}
                        onChange={e => setEditingProduct({...editingProduct, technical_name: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-mono"
                        placeholder="e.g. hikvision_2mp_colorvu_dome"
                      />
                    </div>
                  </div>
                )}

                {/* ── TAB 2: TECHNICAL SPECS ── */}
                {activeTab === "specs" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    
                    {editingProduct.category === "camera" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Resolution (MP)</label>
                          <input 
                            type="number" 
                            value={editingProduct.resolution_mp || ""}
                            onChange={e => setEditingProduct({...editingProduct, resolution_mp: e.target.value ? Number(e.target.value) : undefined})}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Compression</label>
                          <select 
                            value={editingProduct.compression || "H.265"}
                            onChange={e => setEditingProduct({...editingProduct, compression: e.target.value as any})}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none"
                          >
                            <option value="H.264">H.264</option>
                            <option value="H.265">H.265</option>
                            <option value="H.265+">H.265+</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest ml-1">Auto-Storage (GB/Day)</label>
                          <input 
                            readOnly
                            type="number" 
                            value={editingProduct.daily_gb_per_camera || ""}
                            className="w-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-5 py-3.5 text-sm font-black text-emerald-700 dark:text-emerald-400 outline-none"
                            placeholder="Calculated automatically"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Night Vision Type</label>
                          <select 
                            value={editingProduct.night_vision_type || "ir"}
                            onChange={e => setEditingProduct({...editingProduct, night_vision_type: e.target.value as any})}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none"
                          >
                            <option value="ir">IR (B&W)</option>
                            <option value="color">Full Color</option>
                            <option value="dual_light">Dual Light</option>
                            <option value="starlight">Starlight</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">NV Range (m)</label>
                          <input 
                            type="number" 
                            value={editingProduct.night_vision_range_m || ""}
                            onChange={e => setEditingProduct({...editingProduct, night_vision_range_m: e.target.value ? Number(e.target.value) : undefined})}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Form Factor</label>
                          <select 
                            value={editingProduct.form_factor || "dome"}
                            onChange={e => setEditingProduct({...editingProduct, form_factor: e.target.value as any})}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none"
                          >
                            <option value="dome">Dome</option>
                            <option value="bullet">Bullet</option>
                            <option value="ptz">PTZ</option>
                            <option value="turret">Turret</option>
                          </select>
                        </div>
                        
                        {/* Toggles */}
                        <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                          <label className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                            <input type="checkbox" checked={!!editingProduct.has_audio} onChange={e => setEditingProduct({...editingProduct, has_audio: e.target.checked})} className="w-4 h-4 rounded text-blue-600" />
                            <span className="text-xs font-black uppercase tracking-widest">Audio Mic</span>
                          </label>
                          <label className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                            <input type="checkbox" checked={!!editingProduct.wdr} onChange={e => setEditingProduct({...editingProduct, wdr: e.target.checked})} className="w-4 h-4 rounded text-blue-600" />
                            <span className="text-xs font-black uppercase tracking-widest">WDR</span>
                          </label>
                          <label className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                            <input type="checkbox" checked={!!editingProduct.poe} onChange={e => setEditingProduct({...editingProduct, poe: e.target.checked})} className="w-4 h-4 rounded text-blue-600" />
                            <span className="text-xs font-black uppercase tracking-widest">PoE Support</span>
                          </label>
                          <label className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                            <input type="checkbox" checked={!!editingProduct.has_sd_slot} onChange={e => setEditingProduct({...editingProduct, has_sd_slot: e.target.checked})} className="w-4 h-4 rounded text-blue-600" />
                            <span className="text-xs font-black uppercase tracking-widest">SD Slot</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {editingProduct.category === "recorder" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Channels</label>
                          <select 
                            value={editingProduct.channels || 4}
                            onChange={e => setEditingProduct({...editingProduct, channels: Number(e.target.value)})}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none cursor-pointer"
                          >
                            <option value={4}>4 Channels</option>
                            <option value={8}>8 Channels</option>
                            <option value={16}>16 Channels</option>
                            <option value={32}>32 Channels</option>
                            <option value={64}>64 Channels</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Max Cameras Supported</label>
                          <input 
                            type="number" 
                            value={editingProduct.max_cameras || editingProduct.channels || 4}
                            onChange={e => setEditingProduct({...editingProduct, max_cameras: e.target.value ? Number(e.target.value) : undefined})}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Resolution Tier</label>
                          <select 
                            value={editingProduct.resolution_tier || "good"}
                            onChange={e => setEditingProduct({...editingProduct, resolution_tier: e.target.value as any})}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none cursor-pointer"
                          >
                            <option value="good">Up to 2MP</option>
                            <option value="very_clear">Up to 5MP</option>
                            <option value="crystal_clear">Up to 8MP (4K)</option>
                          </select>
                        </div>
                      </div>
                    )}
                    
                    {editingProduct.category !== "camera" && editingProduct.category !== "recorder" && (
                      <div className="p-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">No specific technical attributes for this category.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 3: PRICING ENGINE ── */}
                {activeTab === "pricing" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="bg-zinc-900 dark:bg-white rounded-[24px] p-8 text-white dark:text-zinc-900 shadow-md">
                      <div className="flex items-center gap-3 mb-6">
                        <BadgeDollarSign className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-sm font-black uppercase tracking-widest">Cost-Plus Engine</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Base Cost (₹)</label>
                          <input 
                            required
                            type="number" 
                            value={editingProduct.base_cost !== undefined ? editingProduct.base_cost : ""}
                            onChange={e => setEditingProduct({...editingProduct, base_cost: e.target.value ? Number(e.target.value) : undefined})}
                            className="w-full bg-white dark:bg-black border border-white/10 dark:border-black/10 rounded-xl px-5 py-3.5 text-lg font-black focus:ring-2 focus:ring-white/20 outline-none tabular-nums text-white dark:text-zinc-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Margin (%)</label>
                          <input 
                            required
                            type="number" 
                            value={editingProduct.margin_percentage !== undefined ? editingProduct.margin_percentage : ""}
                            onChange={e => setEditingProduct({...editingProduct, margin_percentage: e.target.value ? Number(e.target.value) : undefined})}
                            className="w-full bg-white dark:bg-black border border-white/10 dark:border-black/10 rounded-xl px-5 py-3.5 text-lg font-black focus:ring-2 focus:ring-white/20 outline-none tabular-nums text-white dark:text-zinc-900"
                          />
                        </div>
                        <div className="bg-emerald-500 rounded-xl p-4 shadow-lg shadow-emerald-500/30">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/80 block mb-1">Final Retail</label>
                          <div className="text-2xl font-black text-white tabular-nums tracking-tight">
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
                    <div className="p-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px]">
                      <div className="mb-6">
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Volume Discounts</h4>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Apply automated discounts for large scale deployments</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Threshold (Camera Count)</label>
                          <input 
                            type="number" 
                            value={editingProduct.bulk_discount_threshold || ""}
                            onChange={e => setEditingProduct({...editingProduct, bulk_discount_threshold: e.target.value ? Number(e.target.value) : undefined})}
                            placeholder="e.g. 8"
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Bulk Unit Price (₹)</label>
                          <input 
                            type="number" 
                            value={editingProduct.bulk_unit_price || ""}
                            onChange={e => setEditingProduct({...editingProduct, bulk_unit_price: e.target.value ? Number(e.target.value) : undefined})}
                            placeholder="Discounted price"
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: MARKETING ── */}
                {activeTab === "marketing" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="p-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-[24px]">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-sm font-black text-amber-900 dark:text-amber-500 uppercase tracking-widest">Silent Margin Boost</h4>
                          <p className="text-[10px] font-bold text-amber-700/60 dark:text-amber-500/60 mt-1 uppercase tracking-widest">Force the engine to recommend this product.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={!!editingProduct.is_focus_product} onChange={e => setEditingProduct({...editingProduct, is_focus_product: e.target.checked})} className="sr-only peer" />
                          <div className="w-14 h-7 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {editingProduct.is_focus_product && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-amber-200/50 dark:border-amber-900/30">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-amber-800 dark:text-amber-600 uppercase tracking-widest ml-1">Boost Priority (1-100)</label>
                            <input 
                              type="number" 
                              value={editingProduct.focus_boost_priority || ""}
                              onChange={e => setEditingProduct({...editingProduct, focus_boost_priority: e.target.value ? Number(e.target.value) : undefined})}
                              className="w-full bg-white dark:bg-zinc-950 border border-amber-200 dark:border-amber-900/50 rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none dark:text-white"
                              placeholder="e.g. 90"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-amber-800 dark:text-amber-600 uppercase tracking-widest ml-1">Internal Reason</label>
                            <input 
                              type="text" 
                              value={editingProduct.focus_reason || ""}
                              onChange={e => setEditingProduct({...editingProduct, focus_reason: e.target.value})}
                              className="w-full bg-white dark:bg-zinc-950 border border-amber-200 dark:border-amber-900/50 rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none dark:text-white"
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
            <div className="px-8 py-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-4 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-xs font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Commit Product
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
