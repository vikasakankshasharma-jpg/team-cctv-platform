"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Search, Banknote, CreditCard, ExternalLink } from "lucide-react";
import type { OfflinePaymentVerification } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettlementsClient({ initialData }: { initialData: OfflinePaymentVerification[] }) {
  const [data, setData] = useState<OfflinePaymentVerification[]>(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const router = useRouter();

  const filteredData = data.filter(d => filter === "all" || d.status === filter);

  const handleVerify = async (id: string, action: "approve" | "reject") => {
    if (!confirm("Are you sure you want to " + action + " this payment?")) return;
    setLoadingId(id);
    try {
      const res = await fetch("/api/admin/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId: id, action })
      });
      if (!res.ok) throw new Error(await res.text());
      
      toast.success("Payment " + action + "d successfully");
      router.refresh();
      // Optimistic update
      setData(prev => prev.map(p => p.id === id ? { ...p, status: action === "approve" ? "approved" : "rejected" } : p));
    } catch (err: any) {
      toast.error(err.message || "Failed to verify");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={"px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all " + (filter === f ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700")}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        {filteredData.length === 0 ? (
          <div className="p-5 md:p-12 text-center text-zinc-500 text-sm">No {filter} settlements found.</div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredData.map(v => (
              <div key={v.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={"w-12 h-12 rounded-full flex items-center justify-center shrink-0 " + (v.method === "cash" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600")}>
                    {v.method === "cash" ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                        {v.installer_name} collected ₹{v.amount.toLocaleString("en-IN")}
                      </h3>
                      <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider " + (v.status === "pending" ? "bg-amber-100 text-amber-700" : v.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                        {v.status}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-500 flex items-center gap-3">
                      <span>Method: <strong className="uppercase">{v.method}</strong></span>
                      {v.utr_number && <span>UTR: <strong className="text-zinc-900 dark:text-white">{v.utr_number}</strong></span>}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Link href={"/admin/leads/" + v.lead_id + "/deal"} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                        View Job <ExternalLink className="w-3 h-3" />
                      </Link>
                      <span className="text-xs text-zinc-400">{formatDistanceToNow(new Date(v.created_at as string), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                {v.status === "pending" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleVerify(v.id, "reject")}
                      disabled={loadingId === v.id}
                      className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      Reject (Dispute)
                    </button>
                    <button
                      onClick={() => handleVerify(v.id, "approve")}
                      disabled={loadingId === v.id}
                      className="px-6 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-emerald-500/20"
                    >
                      {loadingId === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approve & Settle
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
