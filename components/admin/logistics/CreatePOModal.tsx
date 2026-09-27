"use client";

import { useState, useEffect } from "react";
import { Plus, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Vendor, PurchaseOrderItem } from "@/types";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  base_cost: number;
}

export function CreatePOModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    vendor_id: "",
    vendor_name: "",
    hub_id: "DELHI-NCR",
    delivery_mode: "hub_delivery" as any,
    items: [] as PurchaseOrderItem[],
    notes: ""
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/logistics/vendors").then(r => r.json()),
      fetch("/api/admin/products").then(r => r.json())
    ]).then(([vData, pData]) => {
      setVendors(vData.filter((v: Vendor) => v.status === "active"));
      setProducts(pData.map((p: any) => ({
        id: p.id,
        name: p.display_name,
        sku: p.sku || p.internal_sku || p.id.substring(0,6),
        base_cost: p.base_cost || 0
      })));
    }).catch(() => toast.error("Failed to load dependencies"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vId = e.target.value;
    const v = vendors.find(x => x.id === vId);
    setFormData({ ...formData, vendor_id: vId, vendor_name: v?.name || "" });
  };

  const addItem = () => {
    if (products.length === 0) return;
    const p = products[0];
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: p.id,
        sku: p.sku,
        name: p.name,
        quantity: 1,
        unit_cost: p.base_cost,
        total_cost: p.base_cost,
        received_quantity: 0
      }]
    }));
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index], [field]: value };
    
    // Auto-fill other fields if product changes
    if (field === "product_id") {
      const p = products.find(x => x.id === value);
      if (p) {
        item.sku = p.sku;
        item.name = p.name;
        item.unit_cost = p.base_cost;
      }
    }
    
    item.total_cost = Number(item.quantity) * Number(item.unit_cost);
    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) return toast.error("Add at least one item to the PO");
    
    setIsSubmitting(true);
    try {
      const subtotal = formData.items.reduce((sum, item) => sum + item.total_cost, 0);
      const tax = subtotal * 0.18; // 18% generic tax assumption
      
      const payload = {
        ...formData,
        subtotal,
        tax_amount: tax,
        total_amount: subtotal + tax
      };

      const res = await fetch("/api/admin/logistics/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to create PO");
      toast.success("Purchase Order issued!");
      onCreated();
    } catch (err) {
      toast.error("Failed to generate PO");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>;
  }

  const subtotal = formData.items.reduce((sum, item) => sum + item.total_cost, 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-8">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold">Draft Purchase Order</h2>
            <p className="text-gray-500 text-sm mt-1">Issue a new PO to a vendor for drop-shipping or hub delivery.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Select Vendor *</label>
              <select required value={formData.vendor_id} onChange={handleVendorChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="" disabled>-- Select Vendor --</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Delivery Mode *</label>
              <select value={formData.delivery_mode} onChange={e => setFormData({...formData, delivery_mode: e.target.value as any})} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="hub_delivery">Central Hub Delivery</option>
                <option value="installer_pickup">Installer Pick-Up</option>
                <option value="direct_to_customer">Direct Drop-ship to Customer</option>
              </select>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
              <span className="font-bold text-gray-700">Line Items</span>
              <button type="button" onClick={addItem} className="text-xs bg-white border shadow-sm px-3 py-1.5 rounded-lg font-bold text-blue-600 flex items-center gap-1 hover:bg-gray-50">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            
            {formData.items.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No items added yet.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-white border-b text-gray-500">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 w-24">Qty</th>
                    <th className="p-3 w-32">Unit Cost</th>
                    <th className="p-3 w-32">Total</th>
                    <th className="p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {formData.items.map((item, i) => (
                    <tr key={i} className="bg-white">
                      <td className="p-3">
                        <select 
                          value={item.product_id}
                          onChange={e => updateItem(i, "product_id", e.target.value)}
                          className="w-full border-none outline-none focus:ring-0 font-medium"
                        >
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, "quantity", Number(e.target.value))} className="w-full border rounded px-2 py-1 outline-none text-center" />
                      </td>
                      <td className="p-3">
                        <input type="number" min="0" value={item.unit_cost} onChange={e => updateItem(i, "unit_cost", Number(e.target.value))} className="w-full border rounded px-2 py-1 outline-none" />
                      </td>
                      <td className="p-3 font-bold">₹{item.total_cost.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end gap-12 pt-4">
            <div className="text-right">
              <div className="text-gray-500 text-sm">Subtotal: ₹{subtotal.toLocaleString()}</div>
              <div className="text-gray-500 text-sm">Est. Tax (18%): ₹{(subtotal * 0.18).toLocaleString()}</div>
              <div className="text-xl font-black mt-1">Total: ₹{(subtotal * 1.18).toLocaleString()}</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white p-4 -mx-6 -mb-6 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSubmitting || formData.items.length === 0} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? "Generating..." : "Generate & Issue PO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
