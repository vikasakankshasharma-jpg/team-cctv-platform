"use client";

import { useState } from "react";
import { TrendingUp, Clock, CheckCircle2, IndianRupee, History } from "lucide-react";

interface PartnerCommissionsClientProps {
  records: {
    id: string;
    lead_id: string;
    customer_name: string;
    ex_tax_amount: number;
    commission_amount: number;
    status: string;
    created_at: string;
    paid_at?: string;
  }[];
  summary: {
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
  };
}

export function PartnerCommissionsClient({ records, summary }: PartnerCommissionsClientProps) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRecords = records.filter(record => {
    return statusFilter === "all" || record.status === statusFilter;
  });

  const STATS = [
    { label: "Total Earned", value: summary.totalEarned, icon: IndianRupee, color: "text-amber-500", bg: "bg-amber-500/10", stroke: "#f59e0b", percentage: 100 },
    { label: "Pending Verification", value: summary.totalPending, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", stroke: "#3b82f6", percentage: summary.totalEarned > 0 ? Math.round((summary.totalPending / summary.totalEarned) * 100) : 0 },
    { label: "Cleared to Bank", value: summary.totalPaid, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", stroke: "#10b981", percentage: summary.totalEarned > 0 ? Math.round((summary.totalPaid / summary.totalEarned) * 100) : 0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          Commission Ledger
        </h1>
        <p className="text-sm font-medium text-zinc-500 mt-2 max-w-lg">
          Detailed history of your earnings. Pending amounts are automatically transferred to your registered bank account on the 1st of every month.
        </p>
      </div>

      {/* ── KPI GRID ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 rounded-[28px] p-6 shadow-lg shadow-zinc-200/20 dark:shadow-none hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group flex items-center justify-between">
              <div className={`absolute -right-6 -top-6 w-24 h-24 ${stat.bg} rounded-full blur-[40px] opacity-50 group-hover:opacity-100 transition-opacity`} />
              <div className="relative z-10 flex flex-col gap-4">
                <div className={`w-10 h-10 rounded-[14px] ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">₹{stat.value.toLocaleString('en-IN')}</p>
                </div>
              </div>
              
              {/* Progress Ring */}
              <div className="relative w-20 h-20 flex-shrink-0 z-10 hidden sm:block">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-zinc-100 dark:text-zinc-800"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  {/* Progress Circle */}
                  <path
                    style={{ color: stat.stroke }}
                    className="transition-all duration-1000 ease-out"
                    strokeDasharray={`${stat.percentage}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-[10px] font-bold ${stat.color}`}>{stat.percentage}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── LEDGER TABLE ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl">
        <div className="p-4 lg:p-6 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-end bg-zinc-50 dark:bg-zinc-950/40">
          <div className="flex gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            {["all", "pending", "paid"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-6 py-2.5 rounded-[12px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  statusFilter === status 
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-600 font-black uppercase text-[10px] tracking-[0.25em]">
              <tr>
                <th className="px-8 py-6">Ledger Date</th>
                <th className="px-8 py-6">Deal Source</th>
                <th className="px-8 py-6 text-right">Eligible Base (Ex-Tax)</th>
                <th className="px-8 py-6 text-right">Commission Value</th>
                <th className="px-8 py-6 text-center">Payout Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-700 shadow-inner">
                         <History className="w-8 h-8" />
                       </div>
                       <div className="space-y-1">
                         <p className="font-black text-xl text-zinc-900 dark:text-white tracking-widest uppercase">No Records Found</p>
                         <p className="text-zinc-400 dark:text-zinc-600 text-xs font-bold uppercase tracking-tight">Your ledger is empty for this filter.</p>
                       </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all group/row">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                          {new Date(record.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                          Ref: {record.id.slice(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-black text-zinc-900 dark:text-white text-base tracking-tight uppercase">
                        {record.customer_name}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-bold text-zinc-500">
                        ₹{record.ex_tax_amount.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-black text-amber-600 dark:text-amber-500 text-lg">
                        ₹{record.commission_amount.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          record.status === "paid" 
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-500/20"
                        }`}>
                          {record.status === "paid" && <CheckCircle2 className="w-3 h-3" />}
                          {record.status === "pending" && <Clock className="w-3 h-3" />}
                          {record.status}
                        </span>
                        {record.status === "paid" && record.paid_at && (
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-2">
                            {new Date(record.paid_at).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
