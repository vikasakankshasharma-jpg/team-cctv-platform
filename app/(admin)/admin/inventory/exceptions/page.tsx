"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ExceptionsDashboard() {
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExceptions();
  }, []);

  const fetchExceptions = async () => {
    try {
      const res = await fetch("/api/inventory/exceptions", {
         headers: { "X-Mock-Role": "SUPER_ADMIN" }
      });
      const data = await res.json();
      if (data.success) {
        setExceptions(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Exceptions...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-red-900">Inventory Exceptions Queue</h1>
        <p className="text-muted-foreground mt-1">High-priority audits for negative stock balances and reconciliation drift.</p>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Pending Audits</CardTitle>
        </CardHeader>
        <CardContent>
           {exceptions.length === 0 ? (
             <p className="text-green-600 font-bold">✅ No pending inventory exceptions! System is perfectly reconciled.</p>
           ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                 <tr>
                   <th className="px-4 py-3">Exception ID</th>
                   <th className="px-4 py-3">SKU</th>
                   <th className="px-4 py-3">Job Ref</th>
                   <th className="px-4 py-3 text-red-600">Negative Amount</th>
                   <th className="px-4 py-3">Message</th>
                   <th className="px-4 py-3 text-center">Status</th>
                   <th className="px-4 py-3 text-center">Action</th>
                 </tr>
               </thead>
               <tbody>
                 {exceptions.map(exc => (
                   <tr key={exc.id} className="border-b hover:bg-gray-50">
                     <td className="px-4 py-3 font-mono text-xs">{exc.id}</td>
                     <td className="px-4 py-3 font-bold">{exc.skuId}</td>
                     <td className="px-4 py-3">{exc.jobId}</td>
                     <td className="px-4 py-3 text-red-600 font-bold">{exc.negativeAmount}</td>
                     <td className="px-4 py-3">{exc.message}</td>
                     <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                          {exc.status}
                        </Badge>
                     </td>
                     <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="outline">Resolve (Adjust)</Button>
                     </td>
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
