"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    try {
      const res = await fetch("/api/inventory/purchase");
      const data = await res.json();
      if (data.success) {
        setPos(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const receiveMockPO = async (poId: string, items: any[]) => {
    // For demo purposes, we automatically receive all pending items
    const receivedItems = items.map(i => ({
       skuId: i.skuId,
       qty: i.orderedQty - (i.receivedQty || 0)
    })).filter(i => i.qty > 0);
    
    if (receivedItems.length === 0) return;
    
    try {
      await fetch(`/api/inventory/purchase/${poId}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receivedItems })
      });
      fetchPOs();
    } catch (e) {
      console.error(e);
    }
  };

  const createMockPO = async () => {
     try {
       await fetch("/api/inventory/purchase", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           supplierName: "CP Plus Official Distributor",
           items: [
             { skuId: "cam_cp_2mp_bullet", displayName: "CP Plus 2MP Bullet Camera", orderedQty: 50, receivedQty: 0, unitCost: 800 },
             { skuId: "dvr_cp_8ch", displayName: "CP Plus 8CH DVR", orderedQty: 10, receivedQty: 0, unitCost: 3500 },
             { skuId: "cable_bundle", displayName: "3+1 CCTV Cable (90m)", orderedQty: 20, receivedQty: 0, unitCost: 900 }
           ]
         })
       });
       fetchPOs();
     } catch (e) {
       console.error(e);
     }
  };

  if (loading) return <div className="p-8">Loading Procurement...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Procurement</h1>
          <p className="text-muted-foreground mt-1">Manage Supplier Purchase Orders (POs)</p>
        </div>
        <Button onClick={createMockPO} className="bg-blue-600 hover:bg-blue-700">Create Mock PO</Button>
      </div>

      <div className="space-y-4">
         {pos.length === 0 && <p className="text-gray-500 italic">No Purchase Orders found.</p>}
         {pos.map(po => (
            <Card key={po.id}>
               <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                     <CardTitle className="text-lg">{po.id} - {po.supplierName}</CardTitle>
                     <p className="text-xs text-gray-500 mt-1">Created: {format(new Date(po.createdAt), "PPP")}</p>
                  </div>
                  <Badge className={
                     po.status === "RECEIVED" ? "bg-green-100 text-green-800" :
                     po.status === "PARTIAL_RECEIVED" ? "bg-orange-100 text-orange-800" :
                     "bg-gray-100 text-gray-800"
                  }>{po.status}</Badge>
               </CardHeader>
               <CardContent>
                  <table className="w-full text-sm text-left mb-4">
                     <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                        <tr>
                           <th className="px-4 py-2">Item</th>
                           <th className="px-4 py-2 text-right">Ordered</th>
                           <th className="px-4 py-2 text-right">Received</th>
                           <th className="px-4 py-2 text-right">Pending</th>
                        </tr>
                     </thead>
                     <tbody>
                        {po.items.map((item: any, i: number) => (
                           <tr key={i} className="border-b">
                              <td className="px-4 py-2 font-medium">{item.displayName} <span className="text-xs text-gray-400 block">{item.skuId}</span></td>
                              <td className="px-4 py-2 text-right">{item.orderedQty}</td>
                              <td className="px-4 py-2 text-right text-green-600">{item.receivedQty || 0}</td>
                              <td className="px-4 py-2 text-right text-orange-600">{item.orderedQty - (item.receivedQty || 0)}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  
                  {po.status !== "RECEIVED" && (
                     <div className="flex justify-end">
                        <Button onClick={() => receiveMockPO(po.id, po.items)} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                           Receive All Pending Items
                        </Button>
                     </div>
                  )}
               </CardContent>
            </Card>
         ))}
      </div>
    </div>
  );
}
