"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";
import { Loader2, Plus, Save, X, Package, IndianRupee, BadgeDollarSign } from "lucide-react";
import { toast } from "sonner";
import { ProductInventory } from "@/components/admin/ProductInventory";
import { ProductsSkeleton } from "@/components/admin/ProductsSkeleton";
import { BackButton } from "@/components/admin/BackButton";
import { BulkImportExport } from "@/components/admin/BulkImportExport";

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
    setIsModalOpen(true);
  };

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

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen pb-24 transition-colors duration-500">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/60 shadow-sm transition-all duration-500">
        <div className="max-w-[1600px] mx-auto px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <BackButton />
            <div className="w-14 h-14 rounded-[22px] bg-zinc-900 dark:bg-white flex items-center justify-center shadow-2xl shadow-zinc-900/20 dark:shadow-white/5 group hover:rotate-3 transition-transform duration-500">
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
               className="flex items-center gap-3 px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-2xl shadow-zinc-900/20 active:scale-95 group whitespace-nowrap"
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

      {/* ── Premium Modal Interface ────────────────────────────────────── */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/20 dark:bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.1)] dark:shadow-none w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-zinc-200/50 dark:border-zinc-800/60 transition-all scale-100 group">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-10 py-8 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-950/40 backdrop-blur-md">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-[22px] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {editingProduct.id ? "Hardware Matrix Override" : "Inventory Onboarding"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Master SKU:</span>
                     <code className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">{editingProduct.technical_name || "ASSIGNING..."}</code>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/5 transition-all group/close"
              >
                <X className="w-6 h-6 transition-transform group-hover/close:rotate-90" />
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto scrollbar-none">
              <form id="product-form" onSubmit={handleSave} className="space-y-12">
                
                {/* Visual Section: Identity */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                     <span className="w-5 h-px bg-zinc-200 dark:bg-zinc-800" />
                     <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em]">Device Identity</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Commercial Label *</label>
                      <input 
                        required
                        type="text" 
                        value={editingProduct.display_name || ""}
                        onChange={e => setEditingProduct({...editingProduct, display_name: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white"
                        placeholder="e.g. 5MP Full Color Night Vision IP Camera"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Manufacturer / Brand</label>
                      <input 
                        type="text" 
                        value={editingProduct.brand || ""}
                        onChange={e => setEditingProduct({...editingProduct, brand: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white"
                        placeholder="e.g. Local Brand, Hikvision"
                      />
                    </div>
                  </div>
                  <div className="mt-6 space-y-2.5">
                    <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Technical SKU / Internal Name</label>
                    <input 
                      type="text" 
                      value={editingProduct.technical_name || ""}
                      onChange={e => setEditingProduct({...editingProduct, technical_name: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white font-mono"
                      placeholder="e.g. hikvision_2mp_colorvu_dome_3.6mm"
                    />
                    <p className="text-[9px] text-zinc-400 ml-1">Used by scoring engine for inference fallbacks. Auto-generated from display name if left blank.</p>
                  </div>
                </section>

                {/* Visual Section: Classification */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                     <span className="w-5 h-px bg-zinc-200 dark:bg-zinc-800" />
                     <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em]">Technical Classification</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Operational Segment</label>
                      <select 
                        value={editingProduct.category || "camera"}
                        onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white appearance-none cursor-pointer"
                      >
                        <option value="camera">Camera</option>
                        <option value="recorder">Recorder Unit</option>
                        <option value="accessory">Hardware Accessory</option>
                        <option value="cable">Transmission Line</option>
                        <option value="network">Network Infrastructure</option>
                      </select>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Architecture</label>
                      <select 
                        value={editingProduct.technology || "both"}
                        onChange={e => setEditingProduct({...editingProduct, technology: e.target.value as any})}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white appearance-none cursor-pointer"
                      >
                        <option value="HD">Analog HD</option>
                        <option value="IP">Digital IP</option>
                        <option value="both">Hybrid Unified</option>
                      </select>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Catalog Pathing</label>
                      <input 
                        type="text" 
                        value={editingProduct.catalog_path || ""}
                        onChange={e => setEditingProduct({...editingProduct, catalog_path: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white"
                        placeholder="e.g. CCTV/IP/Bullet"
                      />
                    </div>
                  </div>
                </section>

                {/* Visual Section: Camera Specifications */}
                {editingProduct.category === "camera" && (
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                       <span className="w-5 h-px bg-zinc-200 dark:bg-zinc-800" />
                       <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em]">Hardware Specifications</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* Resolution */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Resolution (MP)</label>
                        <input 
                          type="number" 
                          value={editingProduct.resolution_mp || ""}
                          onChange={e => setEditingProduct({...editingProduct, resolution_mp: e.target.value ? Number(e.target.value) : undefined})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white"
                          placeholder="e.g. 5"
                        />
                      </div>
                      {/* Night Vision Type */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Night Vision</label>
                        <select 
                          value={editingProduct.night_vision_type || "ir"}
                          onChange={e => setEditingProduct({...editingProduct, night_vision_type: e.target.value as any})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white appearance-none cursor-pointer"
                        >
                          <option value="ir">IR (B&W)</option>
                          <option value="color">Full Color</option>
                          <option value="dual_light">Dual Light</option>
                          <option value="starlight">Starlight</option>
                        </select>
                      </div>
                      {/* Form Factor */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Form Factor</label>
                        <select 
                          value={editingProduct.form_factor || "dome"}
                          onChange={e => setEditingProduct({...editingProduct, form_factor: e.target.value as any})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white appearance-none cursor-pointer"
                        >
                          <option value="dome">Dome</option>
                          <option value="bullet">Bullet</option>
                          <option value="ptz">PTZ</option>
                          <option value="turret">Turret</option>
                          <option value="fisheye">Fisheye</option>
                        </select>
                      </div>
                      {/* Compression */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Compression</label>
                        <select 
                          value={editingProduct.compression || "H.265"}
                          onChange={e => setEditingProduct({...editingProduct, compression: e.target.value as any})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white appearance-none cursor-pointer"
                        >
                          <option value="H.264">H.264</option>
                          <option value="H.265">H.265</option>
                          <option value="H.265+">H.265+</option>
                        </select>
                      </div>
                      {/* Lens */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Lens (mm)</label>
                        <input 
                          type="number" step="0.1"
                          value={editingProduct.lens_mm || ""}
                          onChange={e => setEditingProduct({...editingProduct, lens_mm: e.target.value ? Number(e.target.value) : undefined})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white"
                          placeholder="e.g. 3.6"
                        />
                      </div>
                      {/* IP Rating */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">IP Rating</label>
                        <input 
                          type="text" 
                          value={editingProduct.ip_rating || ""}
                          onChange={e => setEditingProduct({...editingProduct, ip_rating: e.target.value})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white"
                          placeholder="e.g. IP67"
                        />
                      </div>
                      {/* Warranty */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Warranty (Yrs)</label>
                        <input 
                          type="number" 
                          value={editingProduct.warranty_years || ""}
                          onChange={e => setEditingProduct({...editingProduct, warranty_years: e.target.value ? Number(e.target.value) : undefined})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white"
                          placeholder="e.g. 2"
                        />
                      </div>
                      {/* Viewing Angle */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Viewing Angle (°)</label>
                        <input 
                          type="number" 
                          value={editingProduct.viewing_angle_deg || ""}
                          onChange={e => setEditingProduct({...editingProduct, viewing_angle_deg: e.target.value ? Number(e.target.value) : undefined})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white"
                          placeholder="e.g. 108"
                        />
                      </div>
                      {/* Night Vision Range */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">NV Range (m)</label>
                        <input 
                          type="number" 
                          value={editingProduct.night_vision_range_m || ""}
                          onChange={e => setEditingProduct({...editingProduct, night_vision_range_m: e.target.value ? Number(e.target.value) : undefined})}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white"
                          placeholder="e.g. 30"
                        />
                      </div>
                      
                      {/* Toggles Grid */}
                      <div className="col-span-1 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        <label className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <input type="checkbox" checked={!!editingProduct.has_audio} onChange={e => setEditingProduct({...editingProduct, has_audio: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Audio Mic</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <input type="checkbox" checked={!!editingProduct.wdr} onChange={e => setEditingProduct({...editingProduct, wdr: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">WDR</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <input type="checkbox" checked={!!editingProduct.poe} onChange={e => setEditingProduct({...editingProduct, poe: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">PoE Support</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <input type="checkbox" checked={!!editingProduct.has_sd_slot} onChange={e => setEditingProduct({...editingProduct, has_sd_slot: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">SD Slot</span>
                        </label>
                      </div>

                      {/* AI Features Tag Input */}
                      <div className="col-span-1 md:col-span-4 space-y-3 mt-4">
                        <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">AI / Smart Features</label>
                        <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                          {(editingProduct.ai_features || []).map((tag, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                              {tag}
                              <button
                                type="button"
                                onClick={() => {
                                  const newTags = [...(editingProduct.ai_features || [])];
                                  newTags.splice(i, 1);
                                  setEditingProduct({...editingProduct, ai_features: newTags});
                                }}
                                className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder="Type & press Enter..."
                            className="flex-1 min-w-[120px] bg-transparent text-xs font-bold focus:outline-none dark:text-white"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === ",") {
                                e.preventDefault();
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val && !(editingProduct.ai_features || []).includes(val)) {
                                  setEditingProduct({
                                    ...editingProduct,
                                    ai_features: [...(editingProduct.ai_features || []), val]
                                  });
                                }
                                (e.target as HTMLInputElement).value = "";
                              }
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mr-1 self-center">Quick Add:</span>
                          {["Human Detection", "Vehicle Detection", "Face Detection", "Line Crossing", "Intrusion Detection", "Motion Tracking", "Smart IR"].filter(
                            preset => !(editingProduct.ai_features || []).includes(preset)
                          ).map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setEditingProduct({
                                ...editingProduct,
                                ai_features: [...(editingProduct.ai_features || []), preset]
                              })}
                              className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-zinc-500 dark:text-zinc-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors uppercase tracking-widest"
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Visual Section: Focus Engine */}
                {editingProduct.category === "camera" && (
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                       <span className="w-5 h-px bg-amber-500" />
                       <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.3em]">Marketing & Focus Engine</h3>
                    </div>
                    <div className="p-8 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-3xl space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">Silent Margin Boost</h4>
                          <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">Mark as focus product to organically recommend this in Tier 2.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={!!editingProduct.is_focus_product} onChange={e => setEditingProduct({...editingProduct, is_focus_product: e.target.checked})} className="sr-only peer" />
                          <div className="w-14 h-7 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {editingProduct.is_focus_product && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-amber-200/50 dark:border-amber-900/30">
                          <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest ml-1">Boost Priority (1-100)</label>
                            <input 
                              type="number" 
                              value={editingProduct.focus_boost_priority || ""}
                              onChange={e => setEditingProduct({...editingProduct, focus_boost_priority: e.target.value ? Number(e.target.value) : undefined})}
                              className="w-full bg-white dark:bg-zinc-950 border border-amber-200 dark:border-amber-900/50 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white"
                              placeholder="e.g. 90"
                            />
                          </div>
                          <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest ml-1">Internal Reason</label>
                            <input 
                              type="text" 
                              value={editingProduct.focus_reason || ""}
                              onChange={e => setEditingProduct({...editingProduct, focus_reason: e.target.value})}
                              className="w-full bg-white dark:bg-zinc-950 border border-amber-200 dark:border-amber-900/50 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white"
                              placeholder="e.g. Q3 Distributor Deal"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* PRICING ENGINE: High Fidelity */}
                <section className="bg-zinc-900 dark:bg-white rounded-[32px] p-10 text-white dark:text-zinc-900 shadow-2xl relative overflow-hidden group/pricing transition-all duration-700">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/pricing:scale-110 transition-transform duration-1000">
                     <IndianRupee className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-black/5 flex items-center justify-center">
                          <BadgeDollarSign className="w-5 h-5 text-emerald-400" />
                       </div>
                       <div>
                          <h3 className="text-lg font-black uppercase tracking-tight">Cost-Plus Pricing Engine</h3>
                          <p className="text-[10px] font-bold text-white/40 dark:text-black/40 uppercase tracking-[0.2em] mt-1">Automated margin calculations for quotation parity</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-end">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Procurement Cost (₹)</label>
                        <input 
                          required
                          type="number" 
                          value={editingProduct.base_cost !== undefined ? editingProduct.base_cost : ""}
                          onChange={e => setEditingProduct({...editingProduct, base_cost: e.target.value ? Number(e.target.value) : undefined})}
                          className="w-full bg-white/10 dark:bg-black/5 border border-white/10 dark:border-black/10 rounded-2xl px-6 py-4 text-xl font-black focus:ring-4 focus:ring-white/20 transition-all text-white dark:text-zinc-900 tabular-nums outline-none"
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Profit Margin (%)</label>
                        <div className="relative">
                          <input 
                            required
                            type="number" 
                            value={editingProduct.margin_percentage !== undefined ? editingProduct.margin_percentage : ""}
                            onChange={e => setEditingProduct({...editingProduct, margin_percentage: e.target.value ? Number(e.target.value) : undefined})}
                            className="w-full bg-white/10 dark:bg-black/5 border border-white/10 dark:border-black/10 rounded-2xl px-6 py-4 text-xl font-black focus:ring-4 focus:ring-white/20 transition-all text-white dark:text-zinc-900 tabular-nums outline-none pr-10"
                            placeholder="15"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 dark:text-black/30 font-black">%</span>
                        </div>
                      </div>

                      <div className="bg-emerald-500 rounded-3xl p-6 shadow-xl shadow-emerald-500/30">
                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60 block mb-1">Final Retail Valuation</label>
                        <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
                          ₹ {
                            (editingProduct.base_cost !== undefined && editingProduct.margin_percentage !== undefined)
                              ? Math.round(Number(editingProduct.base_cost) + (Number(editingProduct.base_cost) * (Number(editingProduct.margin_percentage) / 100))).toLocaleString('en-IN')
                              : "0"
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="px-10 py-8 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-950 flex justify-end gap-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-3.5 text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95"
              >
                Cancel Override
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={isSaving}
                className="flex items-center gap-3 px-10 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-zinc-900/20 active:scale-95 disabled:opacity-50 group"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                Commit Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
