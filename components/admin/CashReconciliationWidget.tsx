"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, IndianRupee, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function CashReconciliationWidget() {
  const [pendingQuotes, setPendingQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingCash = async () => {
    try {
      const res = await fetch("/api/admin/pending-cash");
      const data = await res.json();
      if (data.success && data.pendingCashQuotes) {
        setPendingQuotes(data.pendingCashQuotes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCash();
  }, []);

  const handleSettle = async (quoteId: string) => {
    try {
      const res = await fetch("/api/admin/settle-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Cash marked as settled!");
        setPendingQuotes(prev => prev.filter(q => q.id !== quoteId));
      } else {
        toast.error(data.error || "Failed to settle cash.");
      }
    } catch (e) {
      toast.error("Network error.");
    }
  };

  // Group by staff member
  const staffBalances = pendingQuotes.reduce((acc, quote) => {
    const staffName = quote.assigned_delivery_staff?.name || "Unknown Staff";
    const staffPhone = quote.assigned_delivery_staff?.phone || "";
    const key = `${staffName}_${staffPhone}`;
    if (!acc[key]) {
      acc[key] = { name: staffName, phone: staffPhone, total: 0, quotes: [] };
    }
    acc[key].total += (quote.cash_collected_amount || 0);
    acc[key].quotes.push(quote);
    return acc;
  }, {} as Record<string, { name: string, phone: string, total: number, quotes: any[] }>);

  const totalTransitCash = pendingQuotes.reduce((sum, q) => sum + (q.cash_collected_amount || 0), 0);

  if (loading) return null; // or a skeleton

  if (pendingQuotes.length === 0) return null; // Hide widget if no pending cash

  return (
    <Card className="border-rose-200 shadow-sm bg-gradient-to-br from-rose-50 to-white">
      <CardHeader className="pb-3 border-b border-rose-100">
        <CardTitle className="text-rose-900 flex items-center justify-between font-black">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-rose-600" />
            Cash in Transit (Pending Settlement)
          </div>
          <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-sm">
            ₹{totalTransitCash.toLocaleString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {Object.values(staffBalances).map((staff: any, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 border border-rose-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-zinc-900">{staff.name} <span className="text-xs text-zinc-500 font-normal">({staff.phone})</span></p>
              <p className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1">
                Holding: ₹{staff.total.toLocaleString()}
                <span className="text-zinc-400 font-normal ml-1">from {staff.quotes.length} delivery(s)</span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {staff.quotes.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between gap-4 text-xs bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100">
                  <span className="font-mono text-zinc-500">{q.id.slice(0,6)} (₹{q.cash_collected_amount})</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 text-[10px] font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    onClick={() => handleSettle(q.id)}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Settle Cash
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
