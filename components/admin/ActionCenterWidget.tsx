"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Banknote, AlertTriangle, CheckCircle2, XCircle, 
  UploadCloud, ChevronRight, PackageX, Truck, 
  Tag, Clock, Coins
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ActionCenterWidget() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"finance" | "operations" | "sales">("finance");
  
  const [pendingCash, setPendingCash] = useState<any[]>([]);
  const [data, setData] = useState<any>({
    finance: { offline: [], commissions: [], pendingCash: [] },
    operations: { lowStock: [], stalledDispatches: [], pendingDeliveries: [] },
    sales: { priceMatches: [], staleLeads: [], escalatedLeads: [] }
  });

  const fetchData = async () => {
    try {
      const [cashRes, actionRes] = await Promise.all([
        fetch("/api/admin/pending-cash"),
        fetch("/api/admin/action-center")
      ]);
      const cashData = await cashRes.json();
      const actionData = await actionRes.json();

      if (cashData.success && cashData.pendingCashQuotes) setPendingCash(cashData.pendingCashQuotes);
      if (actionData.success) setData(actionData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers for Finance
  const handleSettleCash = async (quoteId: string, type: string) => {
    try {
      const res = await fetch("/api/admin/settle-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, type })
      });
      const d = await res.json();
      if (d.success) {
        toast.success("Cash settled!");
        setPendingCash(prev => prev.filter(q => !(q.quote_id === quoteId && q.type === type)));
      } else {
        toast.error(d.error || "Failed to settle cash.");
      }
    } catch (e) {
      toast.error("Network error.");
    }
  };

  const handleApproveOffline = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/admin/approve-offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action })
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`Payment ${action}d!`);
        setData((prev: any) => ({
          ...prev, 
          finance: { ...prev.finance, offline: prev.finance.offline.filter((p: any) => p.id !== id) }
        }));
      } else {
        toast.error(d.error || "Failed to process.");
      }
    } catch (e) {
      toast.error("Network error.");
    }
  };

  // Group cash by staff
  const staffBalances = pendingCash.reduce((acc, hold) => {
    const staffName = hold.staff_name || "Unknown Staff";
    const staffPhone = hold.staff_phone || "";
    const key = `${staffName}_${staffPhone}`;
    if (!acc[key]) acc[key] = { name: staffName, phone: staffPhone, total: 0, holds: [] };
    acc[key].total += (hold.amount || 0);
    acc[key].holds.push(hold);
    return acc;
  }, {} as Record<string, { name: string, phone: string, total: number, holds: any[] }>);

  // Counts
  const financeCount = pendingCash.length + data.finance.offline.length + data.finance.commissions.length + (data.finance.pendingCash?.length || 0);
  const opsCount = data.operations.lowStock.length + data.operations.stalledDispatches.length + (data.operations.pendingDeliveries?.length || 0);
  const salesCount = data.sales.priceMatches.length + data.sales.staleLeads.length + data.sales.escalatedLeads.length;

  if (loading) return null;
  if (financeCount + opsCount + salesCount === 0) return null;

  return (
    <div className="mb-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Command Center Hub
        </h2>
        <div className="flex bg-zinc-200/60 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab("finance")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "finance" ? "bg-white shadow-sm text-rose-700" : "text-zinc-600 hover:text-zinc-900"}`}
          >
            Finance <span className="bg-rose-100 text-rose-700 ml-1 px-1.5 py-0.5 rounded-full">{financeCount}</span>
          </button>
          <button 
            onClick={() => setActiveTab("operations")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "operations" ? "bg-white shadow-sm text-indigo-700" : "text-zinc-600 hover:text-zinc-900"}`}
          >
            Ops <span className="bg-indigo-100 text-indigo-700 ml-1 px-1.5 py-0.5 rounded-full">{opsCount}</span>
          </button>
          <button 
            onClick={() => setActiveTab("sales")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "sales" ? "bg-white shadow-sm text-blue-700" : "text-zinc-600 hover:text-zinc-900"}`}
          >
            Sales <span className="bg-blue-100 text-blue-700 ml-1 px-1.5 py-0.5 rounded-full">{salesCount}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* ================= FINANCE TAB ================= */}
        {activeTab === "finance" && (
          <>
            {pendingCash.length > 0 && (
              <Card className="border-rose-200 shadow-sm bg-gradient-to-br from-rose-50 to-white">
                <CardHeader className="pb-2 border-b border-rose-100">
                  <CardTitle className="text-rose-900 flex items-center gap-2 text-sm font-bold">
                    <Banknote className="w-4 h-4 text-rose-600" /> Cash in Transit
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  {Object.values(staffBalances).map((staff: any, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-rose-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm text-zinc-900">{staff.name}</p>
                          <p className="text-xs text-rose-600 font-bold">Holding: ₹{staff.total.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {staff.holds.map((h: any) => (
                          <div key={`${h.quote_id}_${h.type}`} className="flex items-center justify-between bg-zinc-50 px-2 py-1.5 rounded text-xs">
                            <span className="font-mono text-zinc-500">#{h.quote_id.slice(0,6)} (₹{h.amount}) <span className="text-[10px] ml-1 bg-zinc-200 px-1 rounded">{h.type}</span></span>
                            <Button size="sm" variant="outline" className="h-6 text-[10px] font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 px-2" onClick={() => handleSettleCash(h.quote_id, h.type)}>
                              Settle
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {data.finance.offline.length > 0 && (
              <Card className="border-orange-200 shadow-sm bg-gradient-to-br from-orange-50 to-white">
                <CardHeader className="pb-2 border-b border-orange-100">
                  <CardTitle className="text-orange-900 flex items-center gap-2 text-sm font-bold">
                    <UploadCloud className="w-4 h-4 text-orange-600" /> Pending Offline Verifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  {data.finance.offline.map((payment: any) => (
                    <div key={payment.id} className="bg-white rounded-lg p-3 border border-orange-100 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-bold text-sm text-zinc-900">{payment.customer_name || "Unknown Customer"}</p>
                          <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Quote #{payment.quote_id?.slice(0,6)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-700">₹{(payment.amount || 0).toLocaleString()}</p>
                          <p className="text-[10px] font-mono text-zinc-500">UTR: {payment.utr_number}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1 border-t border-zinc-50 mt-1">
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={() => handleApproveOffline(payment.id, "approve")}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] font-bold text-rose-700 border-rose-300 hover:bg-rose-50" onClick={() => handleApproveOffline(payment.id, "reject")}>
                          <XCircle className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {data.finance.commissions.length > 0 && (
              <Card className="border-purple-200 shadow-sm bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="pb-2 border-b border-purple-100">
                  <CardTitle className="text-purple-900 flex items-center gap-2 text-sm font-bold">
                    <Coins className="w-4 h-4 text-purple-600" /> Pending Commissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  {data.finance.commissions.map((c: any) => (
                    <div key={c.id} className="bg-white rounded-lg p-3 border border-purple-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-zinc-900">{c.salesperson_name || "Staff"}</p>
                        <p className="text-[11px] text-purple-700 font-bold">₹{c.commission_amount}</p>
                      </div>
                      <Link href="/admin/commission">
                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold text-purple-700 border-purple-300 hover:bg-purple-50">Review</Button>
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ================= OPERATIONS TAB ================= */}
        {activeTab === "operations" && (
          <>
            {data.operations.stalledDispatches.length > 0 && (
              <Card className="border-indigo-200 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
                <CardHeader className="pb-2 border-b border-indigo-100">
                  <CardTitle className="text-indigo-900 flex items-center gap-2 text-sm font-bold">
                    <Truck className="w-4 h-4 text-indigo-600" /> Stalled Dispatches ({'>'}24h)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  {data.operations.stalledDispatches.map((q: any) => (
                    <div key={q.id} className="bg-white rounded-lg p-3 border border-indigo-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-zinc-900">{q.customer_name}</p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                            #{q.id.slice(0,6)} • 
                            <span className={q.status === "BOOKED" || q.payment_status === "advance_paid" ? "text-amber-600 font-bold" : q.payment_status === "partial" || q.status === "MATERIAL_DELIVERED" ? "text-blue-600 font-bold" : "text-green-600 font-bold"}>
                              {q.status === "BOOKED" || q.payment_status === "advance_paid" ? "₹500 Advance" : q.payment_status === "partial" || q.status === "MATERIAL_DELIVERED" ? "90% Paid (Material)" : "100% Paid"}
                            </span>
                          </p>
                      </div>
                      <Link href={`/admin/leads/${q.lead_id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold text-indigo-700 border-indigo-300 hover:bg-indigo-50">Dispatch</Button>
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {(data.operations.pendingDeliveries?.length || 0) > 0 && (
              <Card className="border-violet-200 shadow-sm bg-gradient-to-br from-violet-50 to-white">
                <CardHeader className="pb-2 border-b border-violet-100">
                  <CardTitle className="text-violet-900 flex items-center gap-2 text-sm font-bold">
                    <Truck className="w-4 h-4 text-violet-600" /> Pending Deliveries ({data.operations.pendingDeliveries.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  {data.operations.pendingDeliveries.map((q: any) => (
                    <div key={q.id} className="bg-white rounded-lg p-3 border border-violet-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-zinc-900">{q.customer_name}</p>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          #{q.id.slice(0,6)} • 
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            q.delivery_method === "third_party" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {q.delivery_method === "third_party" ? "🚚 Courier" : q.delivery_method === "installer" ? "🔧 Installer" : q.delivery_method === "salesperson" ? "👤 Sales" : "📦 Staff"}
                          </span>
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            q.payment_status === "delivery_paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {q.payment_status === "delivery_paid" ? "💰 90% Paid" : "⏳ Awaiting Payment"}
                          </span>
                        </p>
                      </div>
                      <Link href={`/admin/leads/${q.lead_id || q.leadId}`}>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold text-violet-700 border-violet-300 hover:bg-violet-50">Track</Button>
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {data.operations.lowStock.length > 0 && (
              <Card className="border-amber-200 shadow-sm bg-gradient-to-br from-amber-50 to-white">
                <CardHeader className="pb-2 border-b border-amber-100">
                  <CardTitle className="text-amber-900 flex items-center gap-2 text-sm font-bold">
                    <PackageX className="w-4 h-4 text-amber-600" /> Low Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  {data.operations.lowStock.map((item: any) => (
                    <div key={item.id} className="bg-white rounded-lg p-3 border border-amber-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-zinc-900 truncate max-w-[200px]">{item.name}</p>
                        <p className="text-[11px] text-red-600 font-bold">Left: {item.availableQty} (Min: {item.minStockLevel})</p>
                      </div>
                      <Link href="/admin/inventory">
                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold text-amber-700 border-amber-300 hover:bg-amber-50">Refill</Button>
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ================= SALES TAB ================= */}
        {activeTab === "sales" && (
          <>
            {data.sales.escalatedLeads.length > 0 && (
              <Card className="border-red-200 shadow-sm bg-gradient-to-br from-red-50 to-white">
                <CardHeader className="pb-2 border-b border-red-100">
                  <CardTitle className="text-red-900 flex items-center gap-2 text-sm font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> Escalated Leads
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 grid gap-3">
                  {data.sales.escalatedLeads.map((lead: any) => (
                    <Link key={lead.id} href={`/admin/leads/${lead.id}`}>
                      <div className="bg-white rounded-lg p-3 border border-red-100 shadow-sm hover:border-red-300 hover:shadow-md transition-all cursor-pointer group flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-zinc-900 group-hover:text-red-700 transition-colors">{lead.customer_name}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{lead.escalation_reason || "Requires intervention"}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-red-500" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {data.sales.priceMatches.length > 0 && (
              <Card className="border-blue-200 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="pb-2 border-b border-blue-100">
                  <CardTitle className="text-blue-900 flex items-center gap-2 text-sm font-bold">
                    <Tag className="w-4 h-4 text-blue-600" /> Price Match Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 grid gap-3">
                  {data.sales.priceMatches.map((pm: any) => (
                    <div key={pm.id} className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-zinc-900">{pm.customer_name || "Customer"}</p>
                        <p className="text-[11px] text-blue-700 font-bold">Competitor: ₹{pm.competitor_price}</p>
                      </div>
                      <Link href="/admin/price-match">
                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold text-blue-700 border-blue-300 hover:bg-blue-50">Review</Button>
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {data.sales.staleLeads.length > 0 && (
              <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-slate-50 to-white">
                <CardHeader className="pb-2 border-b border-slate-100">
                  <CardTitle className="text-slate-900 flex items-center gap-2 text-sm font-bold">
                    <Clock className="w-4 h-4 text-slate-600" /> Stale Leads ({'>'}48h)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 grid gap-3">
                  {data.sales.staleLeads.map((lead: any) => (
                    <div key={lead.id} className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-zinc-900">{lead.customer_name || "Unknown"}</p>
                        <p className="text-[11px] text-zinc-500">Uncontacted for {Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24))} days</p>
                      </div>
                      <Link href={`/admin/leads/${lead.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold text-slate-700 border-slate-300 hover:bg-slate-50">Nudge</Button>
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
