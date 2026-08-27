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
           <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
           {invoices.length === 0 ? (
             <p className="text-gray-500 italic">No invoices generated yet. Wait for a Job to complete.</p>
           ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                 <tr>
                   <th className="px-4 py-3">Invoice / Deal</th>
                   <th className="px-4 py-3">Customer</th>
                   <th className="px-4 py-3 text-right">Grand Total</th>
                   <th className="px-4 py-3 text-right">Paid</th>
                   <th className="px-4 py-3 text-right">Due</th>
                   <th className="px-4 py-3 text-center">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {invoices.map(inv => (
                   <tr key={inv.id} className="border-b hover:bg-gray-50">
                     <td className="px-4 py-3">
                        <span className="font-bold">{inv.id}</span>
                        <span className="block text-xs text-gray-500">{inv.dealId}</span>
                     </td>
                     <td className="px-4 py-3 font-medium text-gray-900">{inv.customerName}</td>
                     <td className="px-4 py-3 text-right">₹{inv.grandTotal.toLocaleString("en-IN")}</td>
                     <td className="px-4 py-3 text-right text-green-600">₹{inv.amountPaid.toLocaleString("en-IN")}</td>
                     <td className="px-4 py-3 text-right text-red-600 font-bold">₹{inv.amountDue.toLocaleString("en-IN")}</td>
                     <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={
                          inv.status === "PAID" ? "bg-green-100 text-green-800 border-green-200" :
                          inv.status === "PARTIAL" ? "bg-orange-100 text-orange-800 border-orange-200" :
                          "bg-red-100 text-red-800 border-red-200"
                        }>{inv.status}</Badge>
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
