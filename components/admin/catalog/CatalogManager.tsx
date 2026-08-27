"use client";

import { useState, useMemo } from "react";
import { Product } from "@/types";
import { resolveWaterfallMargin, calculateSellingPrice } from "@/lib/waterfall-pricing";

export default function CatalogManager({ initialProducts, pricingRules }: { initialProducts: Product[], pricingRules: any }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  
  // Saving
  const [saving, setSaving] = useState(false);

  const brands = useMemo(() => Array.from(new Set(products.map(p => p.brand).filter(Boolean))), [products]);
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))), [products]);

  const filteredProducts = products.filter(p => {
    if (filterBrand !== "ALL" && p.brand !== filterBrand) return false;
    if (filterCategory !== "ALL" && p.category !== filterCategory) return false;
    if (search && !(p.sku || "").toLowerCase().includes(search.toLowerCase()) && !(p.display_name || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const startEdit = (product: Product) => {
    setEditingId(product.id as string);
    setEditForm({
      base_cost: product.base_cost,
      markup_override: product.markup_override,
      is_active: product.is_active,
      is_quotation_eligible: product.is_quotation_eligible,
      is_configurator_visible: product.is_configurator_visible
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (productId: string) => {
    setSaving(true);
    
    // Compute new margin and unit price before saving
    const originalProduct = products.find(p => p.id === productId)!;
    const mockProduct = { ...originalProduct, ...editForm };
    
    const { marginPercent, ruleRef } = resolveWaterfallMargin(mockProduct, pricingRules);
    const newUnitPrice = calculateSellingPrice(mockProduct.base_cost || 0, marginPercent);
    
    try {
      const res = await fetch(`/api/catalog/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          markup_percent: marginPercent,
          pricing_rule_ref: ruleRef,
          unit_price: newUnitPrice
        })
      });
      
      if (res.ok) {
        setProducts(products.map(p => p.id === productId ? {
          ...p,
          ...editForm,
          markup_percent: marginPercent,
          pricing_rule_ref: ruleRef,
          unit_price: newUnitPrice
        } : p));
        setEditingId(null);
      } else {
        alert("Failed to save product.");
      }
    } catch (err) {
      alert("Error saving.");
    }
    setSaving(false);
  };

  // Preview resolution for the currently edited row
  let previewResolution: any = null;
  if (editingId) {
    const originalProduct = products.find(p => p.id === editingId)!;
    const mockProduct = { ...originalProduct, ...editForm };
    const res = resolveWaterfallMargin(mockProduct, pricingRules);
    const sellingPrice = calculateSellingPrice(mockProduct.base_cost || 0, res.marginPercent);
    const profit = sellingPrice - (mockProduct.base_cost || 0);
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    
    previewResolution = {
      ...res,
      sellingPrice,
      profit,
      margin
    };
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4 items-center">
        <input 
          type="text" 
          placeholder="Search SKU or Name..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded p-2 text-sm w-64"
        />
        <select 
          value={filterBrand}
          onChange={e => setFilterBrand(e.target.value)}
          className="border rounded p-2 text-sm"
        >
          <option value="ALL">All Brands</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select 
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="border rounded p-2 text-sm"
        >
          <option value="ALL">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filteredProducts.length} Products Found</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 border-b text-gray-600">
            <tr>
              <th className="p-3">SKU / Product</th>
              <th className="p-3 w-28">Base Cost (₹)</th>
              <th className="p-3 w-28">Override %</th>
              <th className="p-3 w-48">Effective Rule</th>
              <th className="p-3 w-32">Selling Price</th>
              <th className="p-3 w-28">Profit</th>
              <th className="p-3 text-center">Active</th>
              <th className="p-3 text-center">Quote</th>
              <th className="p-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map(p => {
              const isEditing = editingId === p.id;
              
              // If editing, show the preview data. Otherwise show the saved data.
              const currentCost = isEditing ? editForm.base_cost : p.base_cost;
              const ruleSource = isEditing ? previewResolution?.ruleRef : p.pricing_rule_ref;
              const effMarkup = isEditing ? previewResolution?.marginPercent : p.markup_percent;
              const currentPrice = isEditing ? previewResolution?.sellingPrice : p.unit_price;
              
              const profitAbs = (currentPrice || 0) - (currentCost || 0);
              const profitPct = currentPrice ? (profitAbs / currentPrice) * 100 : 0;
              
              return (
                <tr key={p.id} className={isEditing ? "bg-blue-50/50" : "hover:bg-gray-50"}>
                  <td className="p-3">
                    <div className="font-medium text-gray-900">{p.sku}</div>
                    <div className="text-xs text-gray-500 truncate w-48" title={p.display_name}>{p.display_name}</div>
                    <div className="text-xs text-blue-600">{p.brand} &bull; {p.category}</div>
                  </td>
                  
                  {/* Base Cost */}
                  <td className="p-3">
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={editForm.base_cost || ""} 
                        onChange={e => setEditForm({...editForm, base_cost: Number(e.target.value)})}
                        className="w-full border p-1 text-sm rounded bg-white shadow-inner"
                      />
                    ) : (
                      <span className="font-medium">₹{p.base_cost?.toLocaleString()}</span>
                    )}
                  </td>
                  
                  {/* Override */}
                  <td className="p-3">
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={editForm.markup_override ?? ""} 
                        placeholder="Auto"
                        onChange={e => setEditForm({...editForm, markup_override: (e.target.value ? Number(e.target.value) : null) as any})}
                        className="w-full border p-1 text-sm rounded bg-white shadow-inner"
                      />
                    ) : (
                      <span className={p.markup_override !== null && p.markup_override !== undefined ? "font-bold text-orange-600" : "text-gray-400"}>
                        {p.markup_override !== null && p.markup_override !== undefined ? `${p.markup_override}%` : "—"}
                      </span>
                    )}
                  </td>
                  
                  {/* Effective Rule */}
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-blue-600">{effMarkup}%</span>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500">{ruleSource}</span>
                    </div>
                  </td>
                  
                  {/* Selling Price */}
                  <td className="p-3">
                    <span className="font-bold text-gray-900 text-base">₹{currentPrice?.toLocaleString()}</span>
                  </td>
                  
                  {/* Profit */}
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="text-green-600 font-medium">₹{profitAbs.toLocaleString()}</span>
                      <span className="text-xs text-gray-500">{profitPct.toFixed(1)}% margin</span>
                    </div>
                  </td>
                  
                  {/* Toggles */}
                  <td className="p-3 text-center">
                    {isEditing ? (
                      <input 
                        type="checkbox" 
                        checked={!!editForm.is_active} 
                        onChange={e => setEditForm({...editForm, is_active: e.target.checked})}
                        className="w-4 h-4"
                      />
                    ) : (
                      <span className={p.is_active ? "text-green-500" : "text-gray-300"}>●</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {isEditing ? (
                      <input 
                        type="checkbox" 
                        checked={!!editForm.is_quotation_eligible} 
                        onChange={e => setEditForm({...editForm, is_quotation_eligible: e.target.checked})}
                        className="w-4 h-4"
                      />
                    ) : (
                      <span className={p.is_quotation_eligible ? "text-green-500" : "text-gray-300"}>●</span>
                    )}
                  </td>
                  
                  {/* Actions */}
                  <td className="p-3">
                    {isEditing ? (
                      <div className="flex flex-col gap-1">
                        <button onClick={() => saveEdit(p.id!)} disabled={saving} className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Save</button>
                        <button onClick={cancelEdit} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(p)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


