"use client";

import { useState } from "react";
import { HandCoins, CheckCircle2, AlertCircle, Loader2, Search, FileBox } from "lucide-react";
import type { CommissionRecord } from "@/types";
import { PageHeader } from "./PageHeader";
import { markCommissionPaid } from "@/app/actions/commissions";

interface CommissionLedgerClientProps {
  initialRecords: CommissionRecord[];
  promoterMap: Record<string, string>; // promoter_id -> name
  stats: {
    totalPending: number;
    totalPaid: number;
  };
}

export function CommissionLedgerClient({ initialRecords, promoterMap, stats }: CommissionLedgerClientProps) {
  const [filter, setFilter] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const filteredRecords = initialRecords.filter(r => 
    r.promoter_id.toLowerCase().includes(filter.toLowerCase()) || 
    (promoterMap[r.promoter_id] || "").toLowerCase().includes(filter.toLowerCase())
  );

  const handleMarkPaid = async (id: string) => {
    if (!confirm("Are you sure you want to mark this commission as settled?")) return;
    
    setIsProcessing(id);
    try {
      await markCommissionPaid(id);
    } catch (error) {
      console.error("Failed to settle commission:", error);
      alert("Error settling commission. Please try again.");
    } finally {
      setIsProcessing(null);
    }
  };

  const pendingCount = initialRecords.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <PageHeader
        icon={HandCoins}
        title="Commission Ledger"
        description="Monitor, audit, and finalize referral incentive settlements for the Catalyst network."
        badge={`${pendingCount} Pending Distributions`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 hover:border-amber-500/40 rounded-[32px] p-8 overflow-hidden group transition-all backdrop-blur-md shadow-lg dark:shadow-2xl">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.05] dark:opacity-[0.03] group-hover:opacity-[0.1] dark:group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-110">
            <AlertCircle className="w-40 h-40 text-amber-500" />
          </div>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] mb-4">Unpaid Liability</p>
          <p className="text-5xl font-black text-amber-600 dark:text-amber-500 tracking-tighter group-hover:scale-105 origin-left transition-transform">₹{stats.totalPending.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-3 mt-6">
             <span className="text-[10px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 px-4 py-1.5 rounded-full border border-amber-100 dark:border-amber-500/20 uppercase tracking-widest shadow-inner">
                {pendingCount} Records Pending
             </span>
             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
        </div>

        <div className="relative bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 hover:border-emerald-500/40 rounded-[32px] p-8 overflow-hidden group transition-all backdrop-blur-md shadow-lg dark:shadow-2xl">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.05] dark:opacity-[0.03] group-hover:opacity-[0.1] dark:group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-110">
            <CheckCircle2 className="w-40 h-40 text-emerald-500" />
          </div>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] mb-4">All-Time Settled</p>
          <p className="text-5xl font-black text-emerald-600 dark:text-emerald-500 tracking-tighter group-hover:scale-105 origin-left transition-transform">₹{stats.totalPaid.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-3 mt-6 text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
             <CheckCircle2 className="w-4 h-4 text-emerald-500" />
             Audit Managed Asset
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-6 px-2">
          <div className="relative flex-1 max-w-lg group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Query Ledger (Agent, Record ID...)"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/60 text-zinc-900 dark:text-white rounded-[24px] pl-14 pr-6 py-5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold placeholder-zinc-400 dark:placeholder-zinc-700 shadow-inner"
            />
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.3em]">
             <div className="w-12 h-[1px] bg-zinc-200 dark:bg-zinc-800" />
             Historical Ledger
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl backdrop-blur-md transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-600 uppercase text-[10px] tracking-[0.25em] font-black">
                <tr>
                  <th className="px-8 py-6">Payout Manifest</th>
                  <th className="px-8 py-6">Agent Origin</th>
                  <th className="px-8 py-6 text-right">Net Business</th>
                  <th className="px-8 py-6 text-right">Yield Incentive</th>
                  <th className="px-8 py-6 text-center">Settlement</th>
                  <th className="px-8 py-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-50">
                        <HandCoins className="w-12 h-12 text-zinc-300 dark:text-zinc-800" />
                        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">No Commission Modules Resolved</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all group/row">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">REF-{record.id!.slice(-8).toUpperCase()}</span>
                          <span className="text-[9px] font-bold text-zinc-300 dark:text-zinc-700 mt-2 uppercase tracking-tighter italic">LEAD NODE: {record.lead_id.slice(-8).toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                            <span className="font-black text-zinc-900 dark:text-white group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors text-base tracking-tight uppercase">
                            {promoterMap[record.promoter_id] || "System Unlinked"}
                          </span>
                          <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 mt-1 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-950/40 px-2 py-0.5 rounded border border-zinc-100 dark:border-zinc-800/60 w-fit shadow-inner">{record.promoter_id}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-zinc-400 dark:text-zinc-500 text-sm italic">₹{record.ex_tax_amount.toLocaleString('en-IN')}</span>
                          <span className="text-[8px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-widest mt-1">Ex-Tax Capture</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-xl text-emerald-600 dark:text-emerald-500 tracking-tighter">₹{record.commission_amount.toLocaleString('en-IN')}</span>
                          {record.status === 'paid' && record.paid_at && (
                            <span className="text-[8px] font-black text-emerald-700 dark:text-zinc-600 bg-emerald-50 dark:bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/10 mt-2 uppercase tracking-tight">
                              Settled {new Date(record.paid_at.seconds * 1000).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        {record.status === 'paid' ? (
                          <div className="flex items-center justify-center gap-2 text-emerald-500/60">
                             <CheckCircle2 className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Secured</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-amber-500">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Unreleased</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                         {record.status === 'pending' ? (
                           <button
                             onClick={() => handleMarkPaid(record.id!)}
                             disabled={isProcessing === record.id}
                             className="group flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ml-auto shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                           >
                             {isProcessing === record.id ? (
                               <Loader2 className="w-4 h-4 animate-spin" />
                             ) : (
                               <HandCoins className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                             )}
                             Commit Payout
                           </button>
                        ) : (
                           <div className="text-zinc-300 dark:text-zinc-700 text-[10px] font-black uppercase tracking-widest flex justify-end items-center gap-3 group-hover/row:text-zinc-400 dark:group-hover/row:text-zinc-500 transition-colors">
                             <div className="w-8 h-[1px] bg-zinc-100 dark:bg-zinc-800" />
                             Immutable Log
                           </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
