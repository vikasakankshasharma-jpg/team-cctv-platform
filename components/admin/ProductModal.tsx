"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Package, Tag, Layers, Cpu, BadgeIndianRupee, Activity, Link2, ChevronDown } from "lucide-react";
import type { Product } from "@/types";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (data: Omit<Product, "id">) => Promise<void>;
}

export function ProductModal({ isOpen, onClose, product, onSave }: ProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<Product, "id">>({
    display_name: "",
    technical_name: "",
    category: "camera",
    technology: "IP",
    unit_price: 0,
    is_active: true,
  });

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        display_name: product.display_name,
        technical_name: product.technical_name,
        category: product.category,
        technology: product.technology,
        unit_price: product.unit_price,
        is_active: product.is_active ?? true,
        resolution_tier: product.resolution_tier,
        channels: product.channels,
        catalog_path: product.catalog_path ?? "",
        compatible_paths: product.compatible_paths ?? [],
        max_cameras: product.max_cameras,
        min_cameras: product.min_cameras,
        brand: product.brand,
      });
    } else {
      setFormData({
        display_name: "",
        technical_name: "",
        category: "camera",
        technology: "IP",
        unit_price: 0,
        is_active: true,
        catalog_path: "",
        compatible_paths: [],
      });
    }
  }, [product, isOpen]);

  const [newCompatiblePath, setNewCompatiblePath] = useState("");

  const addCompatiblePath = () => {
    if (!newCompatiblePath.trim()) return;
    const current = formData.compatible_paths ?? [];
    if (!current.includes(newCompatiblePath.trim())) {
      setFormData({ ...formData, compatible_paths: [...current, newCompatiblePath.trim()] });
    }
    setNewCompatiblePath("");
  };

  const removeCompatiblePath = (path: string) => {
    const current = formData.compatible_paths ?? [];
    setFormData({ ...formData, compatible_paths: current.filter(p => p !== path) });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Clean up conditional fields before save
    const dataToSave = { ...formData };
    if (dataToSave.category !== "camera") {
      delete dataToSave.resolution_tier;
    }
    if (dataToSave.category !== "recorder") {
      delete dataToSave.channels;
    }

    try {
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error("Failed to save product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-3xl animate-in fade-in duration-500" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative bg-zinc-900/80 border border-zinc-800/60 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-500 max-h-[90vh] flex flex-col">
        
        {/* Header Section */}
        <div className="p-10 pb-6 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  {product ? "Refine Product" : "Catalogue Entry"}
                </h2>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Core Hardware Specification</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-10 pb-10 space-y-8 custom-scrollbar">
          
          {/* Identity Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Marketing Display Name
              </label>
              <input
                required
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full bg-zinc-950/50 border border-zinc-800/60 rounded-3xl px-6 py-4 text-white font-bold placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner"
                placeholder="e.g. TEAM Smart 2MP Dome"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Layers className="w-3 h-3" /> Technical SKU / Model
              </label>
              <input
                required
                type="text"
                value={formData.technical_name}
                onChange={(e) => setFormData({ ...formData, technical_name: e.target.value })}
                className="w-full bg-zinc-950/50 border border-zinc-800/60 rounded-3xl px-6 py-4 text-zinc-300 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner uppercase tracking-wider"
                placeholder="e.g. IPC-D120-I"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Type Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as "camera" | "recorder" | "accessory" | "cable" })}
                className="w-full bg-zinc-950/50 border border-zinc-800/60 rounded-3xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-inner"
              >
                <option value="camera">Camera Unit</option>
                <option value="recorder">Recorder (DVR/NVR)</option>
                <option value="accessory">Accessory</option>
                <option value="cable">Cable / Hard Drive</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Cpu className="w-3 h-3" /> Tech Standard
              </label>
              <select
                value={formData.technology}
                onChange={(e) => setFormData({ ...formData, technology: e.target.value as "IP" | "HD" | "both" })}
                className="w-full bg-zinc-950/50 border border-zinc-800/60 rounded-3xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-inner"
              >
                <option value="IP">IP (Network)</option>
                <option value="HD">HD (Analog)</option>
                <option value="both">Both / Universal</option>
              </select>
            </div>
          </div>

          {/* Pricing & Logic Section */}
          <div className="bg-zinc-950/40 p-8 rounded-[32px] border border-zinc-800/40 space-y-6">
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
               <Activity className="w-3 h-3" /> Logic & Financials
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                    <BadgeIndianRupee className="w-3 h-3" /> Recommended Brand Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 font-black">₹</span>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl pl-10 pr-6 py-4 text-white font-black text-lg focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">
                    Value / Budget Price <span className="normal-case tracking-normal font-normal opacity-70">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 font-black">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.unit_price_budget || ""}
                      onChange={(e) => setFormData({ ...formData, unit_price_budget: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Auto-calculated if empty"
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-10 pr-6 py-3 text-zinc-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">
                    Elite / Premium Price <span className="normal-case tracking-normal font-normal opacity-70">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 font-black">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.unit_price_premium || ""}
                      onChange={(e) => setFormData({ ...formData, unit_price_premium: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Auto-calculated if empty"
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-10 pr-6 py-3 text-zinc-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-zinc-700"
                    />
                  </div>
                </div>
              </div>

              {formData.category === "camera" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 text-emerald-500">Resolution Payload</label>
                  <select
                    value={formData.resolution_tier || "good"}
                    onChange={(e) => setFormData({ ...formData, resolution_tier: e.target.value as "good" | "very_clear" | "crystal_clear" })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="good">Good (2MP)</option>
                    <option value="very_clear">Very Clear (4MP/5MP)</option>
                    <option value="crystal_clear">Crystal Clear (8MP+)</option>
                  </select>
                </div>
              )}

              {formData.category === "recorder" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 text-indigo-400">Channel Capacity</label>
                  <select
                    value={formData.channels || 4}
                    onChange={(e) => setFormData({ ...formData, channels: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value={4}>4-Channel Hub</option>
                    <option value={8}>8-Channel Hub</option>
                    <option value={16}>16-Channel Hub</option>
                    <option value={32}>32-Channel Hub</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 mt-2">
              <div className="space-y-1">
                <p className="text-sm font-black text-white uppercase tracking-tight">Active Catalogue State</p>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Controls availability in live estimation wizard</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-400 after:border-zinc-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white peer-checked:after:border-white transition-all"></div>
              </label>
            </div>
          </div>

          {/* ── Compatibility Section ─────────────────────────────────────── */}
          {(formData.category === "camera" || formData.category === "recorder" || formData.category === "accessory") && (
            <div className="bg-zinc-950/40 p-8 rounded-[32px] border border-indigo-800/30 space-y-6">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Link2 className="w-3 h-3" /> Compatibility Engine
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 block">
                    Catalog Path <span className="normal-case font-normal opacity-60">(e.g., CCTV/Cameras/IP/4MP)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.catalog_path ?? ""}
                    onChange={(e) => setFormData({ ...formData, catalog_path: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                    placeholder="Category / Subcategory / Type"
                  />
                </div>

                {(formData.category === "recorder" || formData.category === "accessory") && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 block">
                        Compatible Paths <span className="normal-case font-normal opacity-60">(What this device supports)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCompatiblePath}
                          onChange={(e) => setNewCompatiblePath(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCompatiblePath();
                            }
                          }}
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                          placeholder="e.g., CCTV/Cameras/IP"
                        />
                        <button
                          type="button"
                          onClick={addCompatiblePath}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(formData.compatible_paths ?? []).length === 0 && (
                          <span className="text-xs text-zinc-600 font-medium italic">No compatible paths added.</span>
                        )}
                        {(formData.compatible_paths ?? []).map(path => (
                          <span key={path} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            {path}
                            <button type="button" onClick={() => removeCompatiblePath(path)} className="text-emerald-500 hover:text-emerald-300">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 block">Max Cameras</label>
                      <select value={formData.max_cameras ?? ""}
                        onChange={e => setFormData({ ...formData, max_cameras: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all appearance-none">
                        <option value="">— Not Set —</option>
                        <option value={1}>1 Camera</option>
                        <option value={4}>4 Cameras</option>
                        <option value={8}>8 Cameras</option>
                        <option value={16}>16 Cameras</option>
                        <option value={32}>32 Cameras</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 block">Min Cameras</label>
                      <select value={formData.min_cameras ?? ""}
                        onChange={e => setFormData({ ...formData, min_cameras: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all appearance-none">
                        <option value="">— Not Set —</option>
                        <option value={1}>1 Camera</option>
                        <option value={5}>5 Cameras</option>
                        <option value={9}>9 Cameras</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-transparent">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-8 py-4 text-xs font-black text-zinc-500 hover:text-white uppercase tracking-[0.2em] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Package className="w-4 h-4 group-hover:scale-125 transition-transform" />
              )}
              {product ? "Sync System" : "Commit to Inventory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
