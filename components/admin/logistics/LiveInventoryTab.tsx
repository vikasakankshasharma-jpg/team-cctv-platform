"use client";

import { useState, useEffect } from "react";
import { Search, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Vendor } from "@/types";

export function LiveInventoryTab() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
      }
    } catch (err) {
      toast.error("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = inventory.filter(p => 
    p.display_name?.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-0">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-[24px]">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search SKU or Product..." 
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="text-sm font-bold text-blue-600 hover:underline">Download Stock Report</button>
      </div>

      {isLoading ? (
        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-bold border-b">
            <tr>
              <th className="px-6 py-4">Product / SKU</th>
              <th className="px-6 py-4">Brand</th>
              <th className="px-6 py-4">Physical Stock</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-gray-500">No products found.</td>
              </tr>
            ) : (
              filtered.map(p => {
                const stock = p.stock_quantity || 0;
                const isLow = stock < 5;
                return (
                  <tr key={p.id} className="hover:bg-blue-50/30">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{p.display_name}</div>
                      <div className="text-gray-500 text-xs">SKU: {p.sku || p.internal_sku || p.id.substring(0, 6)}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">{p.brand || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`font-black text-lg ${isLow ? 'text-red-600' : ''}`}>{stock}</span> units
                    </td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          <AlertTriangle className="w-3.5 h-3.5" /> Critical Low
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
