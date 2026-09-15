"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function FinanceDashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/finance/invoices");
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Finance Dashboard...</div>;

  const totalOutstanding = invoices.filter(i => i.status !== "PAID" && i.status !== "CANCELLED").reduce((acc, i) => acc + i.amountDue, 0);
  const totalCollected = invoices.reduce((acc, i) => acc + (i.amountPaid || 0), 0);
  const totalRevenue = invoices.filter(i => i.status !== "CANCELLED").reduce((acc, i) => acc + i.grandTotal, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Finance & Billing</h1>
        <p className="text-muted-foreground mt-1">Manage Invoices, Collections, and Realized Profitability</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total Outstanding (Receivables)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">₹{totalOutstanding.toLocaleString("en-IN")}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">₹{totalCollected.toLocaleString("en-IN")}</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Booked Revenue (Invoiced)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">₹{totalRevenue.toLocaleString("en-IN")}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Recent Tax Invoices & Collections ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
           {invoices.length === 0 ? (
             <p className="text-gray-500 italic py-8 text-center">No invoices generated yet.</p>
           ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-zinc-800 border-b">
                 <tr>
                   <th className="px-4 py-3">Invoice / Deal</th>
                   <th className="px-4 py-3">Customer / Firm</th>
                   <th className="px-4 py-3">Entity Type & GSTIN</th>
                   <th className="px-4 py-3 text-right">Tax (18%)</th>
                   <th className="px-4 py-3 text-right">Grand Total</th>
                   <th className="px-4 py-3 text-right">Collected</th>
                   <th className="px-4 py-3 text-right">Balance Due</th>
                   <th className="px-4 py-3 text-center">Status</th>
                   <th className="px-4 py-3 text-right">Action</th>
                 </tr>
               </thead>
               <tbody>
                 {invoices.map(inv => {
                   const isB2B = inv.is_business || !!inv.gstin || !!inv.companyName;
                   const downloadId = inv.quoteId || inv.dealId || inv.id;

                   return (
                     <tr key={inv.id} className="border-b hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                       <td className="px-4 py-3">
                          <span className="font-bold font-mono text-xs">{inv.id}</span>
                          {inv.dealId && (
                            <span className="block text-[11px] text-muted-foreground font-mono">{inv.dealId}</span>
                          )}
                          <span className="text-[10px] text-zinc-400 block">
                            {format(new Date(inv.issueDate), "dd MMM yyyy")}
                          </span>
                       </td>
                       <td className="px-4 py-3">
                         <div className="font-bold text-gray-900 dark:text-white">
                           {inv.companyName || inv.customerName}
                         </div>
                         {inv.customerMobile && (
                           <div className="text-xs text-muted-foreground">{inv.customerMobile}</div>
                         )}
                       </td>
                       <td className="px-4 py-3">
                         {isB2B ? (
                           <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800 text-[10px] font-bold">
                             🏢 B2B {inv.gstin ? `(${inv.gstin})` : ""}
                           </Badge>
                         ) : (
                           <span className="text-xs text-muted-foreground">👤 Consumer (B2C)</span>
                         )}
                       </td>
                       <td className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                         ₹{(inv.taxAmount || 0).toLocaleString("en-IN")}
                       </td>
                       <td className="px-4 py-3 text-right font-bold">
                         ₹{inv.grandTotal.toLocaleString("en-IN")}
                       </td>
                       <td className="px-4 py-3 text-right text-emerald-600 font-bold">
                         ₹{(inv.amountPaid || 0).toLocaleString("en-IN")}
                       </td>
                       <td className="px-4 py-3 text-right text-red-600 font-bold">
                         ₹{(inv.amountDue || 0).toLocaleString("en-IN")}
                       </td>
                       <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={
                            inv.status === "PAID" ? "bg-green-100 text-green-800 border-green-200 font-bold" :
                            inv.status === "PARTIAL" ? "bg-orange-100 text-orange-800 border-orange-200 font-bold" :
                            "bg-red-100 text-red-800 border-red-200 font-bold"
                          }>{inv.status}</Badge>
                       </td>
                       <td className="px-4 py-3 text-right">
                         <div className="flex items-center justify-end gap-1.5">
                           <a
                             href={`/api/invoice/${downloadId}/download`}
                             target="_blank"
                             rel="noreferrer"
                             className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                           >
                             PDF Invoice
                           </a>
                         </div>
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
