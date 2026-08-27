"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      if (data.success) {
        setInventory(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Warehouse...</div>;

  const lowStockItems = inventory.filter(i => i.availableQty <= i.minStockLevel);
  const outOfStockItems = inventory.filter(i => i.availableQty === 0);
  
  const totalValue = inventory.reduce((acc, item) => acc + (item.availableQty * item.costPrice), 0);

  const filtered = inventory.filter(i => 
    i.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory Master</h1>
          <p className="text-muted-foreground mt-1">Real-time stock levels, valuations, and shortages.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/inventory/purchase">
            <Button variant="outline">Purchase Orders</Button>
          </Link>
          <Link href="/admin/inventory/ledger">
            <Button variant="outline">Stock Ledger</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{outOfStockItems.length}</div>
            <p className="text-xs text-red-700 mt-1">Cannot be dispatched</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{lowStockItems.length - outOfStockItems.length}</div>
            <p className="text-xs text-orange-700 mt-1">Needs replenishment</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{inventory.length}</div>
            <p className="text-xs text-blue-700 mt-1">Active items tracked</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Stock Valuation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">₹{totalValue.toLocaleString("en-IN")}</div>
            <p className="text-xs text-green-700 mt-1">Based on base cost</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle>SKU Tracker</CardTitle>
           <Input 
             placeholder="Search items or brands..." 
             className="max-w-xs"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </CardHeader>
        <CardContent>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                 <tr>
                   <th className="px-4 py-3">Item Name</th>
                   <th className="px-4 py-3">Brand</th>
                   <th className="px-4 py-3">Category</th>
                   <th className="px-4 py-3 text-right">Available Qty</th>
                   <th className="px-4 py-3 text-right">Reserved (In Jobs)</th>
                   <th className="px-4 py-3 text-right">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {filtered.map(item => (
                   <tr key={item.id} className="border-b hover:bg-gray-50">
                     <td className="px-4 py-3 font-medium text-gray-900">{item.displayName}</td>
                     <td className="px-4 py-3">{item.brand}</td>
                     <td className="px-4 py-3">{item.category}</td>
                     <td className="px-4 py-3 text-right font-bold">{item.availableQty}</td>
                     <td className="px-4 py-3 text-right text-orange-600">{item.reservedQty}</td>
                     <td className="px-4 py-3 text-right">
                        {item.availableQty === 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : item.availableQty <= item.minStockLevel ? (
                          <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">Low Stock</Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Healthy</Badge>
                        )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
