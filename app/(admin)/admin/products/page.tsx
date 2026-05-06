"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";
import { Loader2, Plus, ShieldCheck, ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ProductInventory } from "@/components/admin/ProductInventory";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featureTags, setFeatureTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#4F46E5]" />
                Product Catalog Manager
              </h1>
              <p className="text-sm text-neutral-500">Manage pricing, margins, and stock availability.</p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-sm font-medium hover:bg-[#4338ca] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Loading catalog…</p>
          </div>
        ) : (
          <ProductInventory
            products={products}
            onEdit={handleEdit}
            onToggle={handleToggleActive}
          />
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold text-neutral-900">
                {editingProduct.id ? "Edit Product" : "Add New Product"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="product-form" onSubmit={handleSave} className="space-y-6">
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Display Name *</label>
                    <input 
                      required
                      type="text" 
                      value={editingProduct.display_name || ""}
                      onChange={e => setEditingProduct({...editingProduct, display_name: e.target.value})}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                      placeholder="e.g. 2TB HDD Seagate"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Technical Name / ID *</label>
                    <input 
                      required
                      type="text" 
                      value={editingProduct.technical_name || ""}
                      onChange={e => setEditingProduct({...editingProduct, technical_name: e.target.value})}
                      disabled={!!editingProduct.id}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] disabled:bg-neutral-50 disabled:text-neutral-500"
                      placeholder="e.g. hdd_2tb"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Category *</label>
                    <select 
                      value={editingProduct.category || "camera"}
                      onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                    >
                      <option value="camera">Camera</option>
                      <option value="recorder">Recorder (DVR/NVR)</option>
                      <option value="accessory">Accessory (HDD/PSU)</option>
                      <option value="cable">Cable</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Technology *</label>
                    <select 
                      value={editingProduct.technology || "both"}
                      onChange={e => setEditingProduct({...editingProduct, technology: e.target.value as any})}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                    >
                      <option value="HD">HD Only</option>
                      <option value="IP">IP Only</option>
                      <option value="both">Both (HD & IP)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Brand</label>
                    <input 
                      type="text" 
                      value={editingProduct.brand || ""}
                      onChange={e => setEditingProduct({...editingProduct, brand: e.target.value})}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                      placeholder="e.g. CP Plus, Seagate"
                    />
                  </div>
                </div>

                {/* Advanced Routing / Capability Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-100 pt-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Catalog Path</label>
                    <input 
                      type="text" 
                      value={editingProduct.catalog_path || ""}
                      onChange={e => setEditingProduct({...editingProduct, catalog_path: e.target.value})}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                      placeholder="e.g. CCTV/Accessories/HDD"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Max Cameras</label>
                    <input 
                      type="number" 
                      value={editingProduct.max_cameras || ""}
                      onChange={e => setEditingProduct({...editingProduct, max_cameras: parseInt(e.target.value) || undefined})}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                      placeholder="For DVR/NVR/PoE"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Stock Status</label>
                    <div className="flex items-center h-10">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={!!editingProduct.is_active} 
                          onChange={e => setEditingProduct({...editingProduct, is_active: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span className="ms-3 text-sm font-medium text-neutral-700">
                          {editingProduct.is_active ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Resolution MP — camera only */}
                {editingProduct.category === 'camera' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Camera Resolution (MP) *
                    </label>
                    <select
                      value={editingProduct.resolution_mp ?? ""}
                      onChange={e => setEditingProduct({ ...editingProduct, resolution_mp: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                    >
                      <option value="">— Select resolution —</option>
                      <option value="2">2 MP — Standard HD</option>
                      <option value="4">4 MP — Pro HD</option>
                      <option value="5">5 MP — Ultra HD</option>
                      <option value="6">6 MP — Premium</option>
                      <option value="8">8 MP — Professional Grade</option>
                    </select>
                    <p className="text-[10px] text-neutral-400">
                      This drives which resolution options appear in the customer wizard. Keep it accurate.
                    </p>
                  </div>
                )}

                {/* Dynamic Features Assignment */}
                {editingProduct.category === 'camera' && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mt-6">
                    <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      Dynamic Features & Capabilities
                    </h3>
                    <p className="text-xs text-blue-700 mb-4">
                      Select all features this camera supports. These will be matched against customer selections in the Wizard.
                    </p>
                    
                    {featureTags.length === 0 ? (
                      <div className="text-sm text-blue-600 italic">No feature tags defined yet. Create them in the Features tab.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {featureTags.map(tag => {
                          const isSelected = editingProduct.features?.includes(tag.id) || false;
                          return (
                            <label key={tag.id} className="relative flex items-start gap-3 cursor-pointer group">
                              <div className="flex items-center h-5">
                                <input 
                                  type="checkbox"
                                  className="w-4 h-4 text-blue-600 bg-white border-neutral-300 rounded focus:ring-blue-500"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const currentFeatures = editingProduct.features || [];
                                    if (e.target.checked) {
                                      setEditingProduct({...editingProduct, features: [...currentFeatures, tag.id]});
                                    } else {
                                      setEditingProduct({...editingProduct, features: currentFeatures.filter(id => id !== tag.id)});
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-neutral-900 group-hover:text-blue-700 transition-colors">
                                  {tag.technical_name}
                                </span>
                                <span className="text-[10px] text-neutral-500 line-clamp-1" title={tag.customer_label}>
                                  {tag.customer_label}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* PRICING ENGINE */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mt-6">
                  <h3 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Cost-Plus Margin Pricing
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Base Cost (₹) *</label>
                      <input 
                        required
                        type="number" 
                        value={editingProduct.base_cost !== undefined ? editingProduct.base_cost : ""}
                        onChange={e => {
                          const val = e.target.value ? Number(e.target.value) : undefined;
                          setEditingProduct({...editingProduct, base_cost: val});
                        }}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] bg-white font-mono"
                        placeholder="e.g. 1300"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Margin (%) *</label>
                      <div className="relative">
                        <input 
                          required
                          type="number" 
                          value={editingProduct.margin_percentage !== undefined ? editingProduct.margin_percentage : ""}
                          onChange={e => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            setEditingProduct({...editingProduct, margin_percentage: val});
                          }}
                          className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-mono pr-8"
                          placeholder="e.g. 15"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">%</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Final Selling Price</label>
                      <div className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-100 text-neutral-900 font-bold font-mono">
                        ₹ {
                          (editingProduct.base_cost !== undefined && editingProduct.margin_percentage !== undefined)
                            ? Math.round(Number(editingProduct.base_cost) + (Number(editingProduct.base_cost) * (Number(editingProduct.margin_percentage) / 100))).toLocaleString('en-IN')
                            : editingProduct.unit_price?.toLocaleString('en-IN') || "0"
                        }
                      </div>
                      <p className="text-[10px] text-neutral-500 mt-1 leading-tight">
                        Calculated automatically. This price is displayed in the Quotation Wizard.
                      </p>
                    </div>
                  </div>
                </div>
                
              </form>
            </div>
            
            <div className="border-t border-neutral-100 px-6 py-4 bg-neutral-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#4F46E5] rounded-lg hover:bg-[#4338ca] transition-colors disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingProduct.id ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
