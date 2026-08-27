"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StockLedgerPage() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const res = await fetch("/api/inventory/ledger");
      const data = await res.json();
      if (data.success) {
        setLedger(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Audit Trail...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Stock Ledger</h1>
        <p className="text-muted-foreground mt-1">Immutable audit trail of all material movements.</p>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
           {ledger.length === 0 ? (
             <p className="text-gray-500 italic">No transactions found.</p>
           ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                 <tr>
                   <th className="px-4 py-3">Timestamp</th>
                   <th className="px-4 py-3">SKU</th>
                   <th className="px-4 py-3">Type</th>
                   <th className="px-4 py-3 text-right">Qty</th>
                   <th className="px-4 py-3">Reference</th>
                   <th className="px-4 py-3">Performed By</th>
                 </tr>
               </thead>
               <tbody>
                 {ledger.map(txn => (
                   <tr key={txn.id} className="border-b hover:bg-gray-50">
                     <td className="px-4 py-3 whitespace-nowrap text-gray-500">{format(new Date(txn.timestamp), "MMM d, HH:mm")}</td>
                     <td className="px-4 py-3 font-medium text-gray-900">{txn.skuId}</td>
                     <td className="px-4 py-3">
                        <Badge variant="outline" className={
                          txn.type === "IN" ? "bg-green-100 text-green-800 border-green-200" :
                          txn.type === "OUT" ? "bg-red-100 text-red-800 border-red-200" :
                          txn.type === "RESERVE" ? "bg-orange-100 text-orange-800 border-orange-200" :
                          "bg-blue-100 text-blue-800 border-blue-200"
                        }>{txn.type}</Badge>
                     </td>
                     <td className="px-4 py-3 text-right font-bold">{txn.quantity}</td>
                     <td className="px-4 py-3">
                        <span className="text-blue-600 hover:underline cursor-pointer">{txn.referenceId}</span>
                        <span className="block text-xs text-gray-400">{txn.notes}</span>
                     </td>
                     <td className="px-4 py-3 text-gray-600">{txn.performedBy}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
