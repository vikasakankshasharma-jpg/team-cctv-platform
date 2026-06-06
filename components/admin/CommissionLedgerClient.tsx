"use client";

import { useState } from "react";
import { HandCoins, CheckCircle2, AlertCircle, Loader2, Search, Download } from "lucide-react";
import type { CommissionRecord } from "@/types";
import { PageHeader } from "./PageHeader";
import { markCommissionPaid } from "@/app/actions/commissions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface CommissionLedgerClientProps {
  initialRecords: CommissionRecord[];
  nameMap: Record<string, { name: string; role: string }>; 
  stats: {
    totalPending: number;
    totalPaid: number;
  };
}

export function CommissionLedgerClient({ initialRecords, nameMap, stats }: CommissionLedgerClientProps) {
  const [filter, setFilter] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const filteredRecords = initialRecords.filter(r => {
    const userId = r.user_id || r.promoter_id;
    const nameData = (userId ? nameMap[userId] : undefined) || { name: "Unknown", role: r.user_type || "Promoter" };
    return (
      (userId && userId.toLowerCase().includes(filter.toLowerCase())) || 
      nameData.name.toLowerCase().includes(filter.toLowerCase())
    );
  });

  const handleMarkPaid = async (id: string) => {
    if (!window.confirm("Mark this commission as paid? This cannot be undone.")) return;
    setIsProcessing(id);
    try {
      await markCommissionPaid(id);
      toast.success("Commission marked as paid");
      // Since this is a server action, the page will revalidate
    } catch (error) {
      console.error("Failed to settle commission:", error);
      toast.error("Failed to settle commission. Please try again.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleExportCSV = () => {
    const pendingRecords = initialRecords.filter(r => r.status === "pending");
    if (pendingRecords.length === 0) {
      toast.info("No pending records to export");
      return;
    }

    const headers = ["Record ID", "Date", "Name", "Role", "User ID", "Lead ID", "Sale Value", "Commission Amount"];
    const csvRows = [headers.join(",")];

    pendingRecords.forEach(r => {
      const userId = r.user_id || r.promoter_id;
      const nameData = (userId ? nameMap[userId] : undefined) || { name: "Unknown", role: r.user_type || "Promoter" };
      const date = new Date(r.created_at as any).toLocaleDateString();
      
      const row = [
        `REF-${r.id!.slice(-8).toUpperCase()}`,
        date,
        `"${nameData.name}"`,
        nameData.role,
        userId,
        r.lead_id,
        r.ex_tax_amount,
        r.commission_amount
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pending_payouts_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const pendingCount = initialRecords.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <PageHeader
        icon={HandCoins}
        title="Commission Ledger"
        description="Track and settle commissions for Promoters and Sales Staff."
        badge={`${pendingCount} Pending`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative bg-card border border-border hover:border-warning/30 rounded-2xl p-8 overflow-hidden group transition-all shadow-sm">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-110">
            <AlertCircle className="w-40 h-40 text-warning" />
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Unpaid Liability</p>
          <p className="text-4xl font-semibold text-warning tracking-tight group-hover:scale-105 origin-left transition-transform">₹{stats.totalPending.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-3 mt-6">
             <span className="text-[11px] font-semibold bg-warning/10 text-warning px-3 py-1 rounded-md border border-warning/20">
                {pendingCount} Records Pending
             </span>
             <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          </div>
        </div>

        <div className="relative bg-card border border-border hover:border-success/30 rounded-2xl p-8 overflow-hidden group transition-all shadow-sm">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-110">
            <CheckCircle2 className="w-40 h-40 text-success" />
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">All-Time Settled</p>
          <p className="text-4xl font-semibold text-success tracking-tight group-hover:scale-105 origin-left transition-transform">₹{stats.totalPaid.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-2 mt-6 text-[11px] font-medium text-muted-foreground">
             <CheckCircle2 className="w-4 h-4 text-success" />
              Fully settled
           </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
          <div className="relative w-full max-w-lg group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Filter by name or ID..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-background border border-border text-foreground rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder-muted-foreground shadow-sm"
            />
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-zinc-700 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Export Pending to CSV
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                 <tr>
                   <th className="px-6 py-4">Record</th>
                   <th className="px-6 py-4">Payee</th>
                   <th className="px-6 py-4 text-right">Sale Value</th>
                   <th className="px-6 py-4 text-right">Commission</th>
                   <th className="px-6 py-4 text-center">Status</th>
                   <th className="px-6 py-4 text-right">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-60">
                        <HandCoins className="w-10 h-10 text-muted-foreground" />
                        <p className="text-sm font-medium">No records found matching your search</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const userId = record.user_id || record.promoter_id;
                    const nameData = (userId ? nameMap[userId] : undefined) || { name: "Unknown", role: record.user_type || "Promoter" };
                    return (
                    <tr key={record.id} className="hover:bg-secondary/40 transition-colors group/row">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                           <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-muted-foreground">REF-{record.id!.slice(-8).toUpperCase()}</span>
                           <span className="text-[10px] font-medium text-muted-foreground">Lead: {record.lead_id.slice(-8).toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground group-hover/row:text-primary transition-colors text-sm truncate max-w-[200px]">
                              {nameData.name}
                            </span>
                            <Badge variant="outline" className="text-[9px] py-0 h-4 uppercase tracking-wider">{nameData.role}</Badge>
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[200px]">{userId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-medium text-foreground text-sm">₹{record.ex_tax_amount.toLocaleString('en-IN')}</span>
                           <span className="text-[10px] text-muted-foreground">Ex-Tax</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-semibold text-base text-success tracking-tight">₹{record.commission_amount.toLocaleString('en-IN')}</span>
                          {record.status === 'paid' && (record.paid_at as any) && (
                            <span className="text-[10px] font-medium text-muted-foreground mt-1">
                              {new Date(((record.paid_at as any).seconds ? (record.paid_at as any).seconds * 1000 : record.paid_at) as any).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {record.status === 'paid' ? (
                          <div className="inline-flex items-center justify-center gap-1.5 text-success bg-success/10 px-2.5 py-1 rounded-md">
                             <CheckCircle2 className="w-3.5 h-3.5" />
                             <span className="text-[11px] font-semibold">Paid</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center gap-1.5 text-warning bg-warning/10 px-2.5 py-1 rounded-md">
                             <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                             <span className="text-[11px] font-semibold">Pending</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                         {record.status === 'pending' ? (
                           <button
                             onClick={() => handleMarkPaid(record.id!)}
                             disabled={isProcessing === record.id}
                             className="group flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-full text-xs font-semibold transition-all ml-auto shadow-sm active:scale-95 disabled:opacity-50"
                           >
                             {isProcessing === record.id ? (
                               <Loader2 className="w-4 h-4 animate-spin" />
                             ) : (
                               <HandCoins className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                             )}
                            Settle
                           </button>
                        ) : (
                            <div className="text-muted-foreground text-[11px] font-medium flex justify-end items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-success" />
                              Settled
                            </div>
                        )}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
