"use client";

import { useState } from "react";
import { Search, Filter, Target, History, Users } from "lucide-react";

interface PartnerLeadsClientProps {
  initialLeads: {
    id: string;
    customer_name: string;
    property_type: string;
    technology_choice: string;
    status: string;
    created_at: string;
    total_payable: number;
    commission_amount: number;
  }[];
}

export function PartnerLeadsClient({ initialLeads }: PartnerLeadsClientProps) {
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLeads = initialLeads.filter(lead => {
    const matchesSearch = lead.customer_name.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case 'contacted': return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case 'site_visit': return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case 'quoted': return "bg-zinc-800 text-zinc-400 border-zinc-700";
      case 'won': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]";
      case 'lost': return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return "Incoming";
      case 'contacted': return "Synthesized";
      case 'site_visit': return "Deployment";
      case 'quoted': return "Finalizing";
      case 'won': return "Captured";
      case 'lost': return "Terminated";
      default: return status;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* ── HEADER & FILTERS ────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            My Pipeline
          </h1>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-lg">
            Track all your referrals in real-time. Full transparency into won and lost deals.
          </p>
        </div>

        <div className="flex flex-1 lg:flex-none gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-amber-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search leads..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-[24px] pl-14 pr-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 transition-all font-bold placeholder-zinc-400 shadow-inner"
            />
          </div>
          <div className="relative w-48 group">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-amber-500 pointer-events-none transition-colors" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-[24px] pl-14 pr-10 py-4 text-[11px] focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 transition-all appearance-none cursor-pointer font-black uppercase tracking-widest shadow-inner"
            >
              <option value="all">All Status</option>
              <option value="new">Incoming</option>
              <option value="contacted">Synthesized</option>
              <option value="site_visit">Deployment</option>
              <option value="quoted">Finalizing</option>
              <option value="won">Captured</option>
              <option value="lost">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── LEADS TABLE ─────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-600 font-black uppercase text-[10px] tracking-[0.25em]">
              <tr>
                <th className="px-8 py-6">Date</th>
                <th className="px-8 py-6">Customer</th>
                <th className="px-8 py-6">Details</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-right">Value / Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 font-medium">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-700 shadow-inner">
                         <Users className="w-8 h-8" />
                       </div>
                       <div className="space-y-1">
                         <p className="font-black text-xl text-zinc-900 dark:text-white tracking-widest uppercase">No Leads Found</p>
                         <p className="text-zinc-400 dark:text-zinc-600 text-xs font-bold uppercase tracking-tight">Your pipeline is empty for this filter.</p>
                       </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all group/row">
                    <td className="px-8 py-6 text-zinc-500 dark:text-zinc-400 font-bold text-[11px] tracking-widest uppercase whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-black text-zinc-900 dark:text-white text-base tracking-tight uppercase">
                        {lead.customer_name}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className="capitalize font-black text-[9px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/5 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/10 tracking-widest shadow-inner">
                           {lead.property_type}
                        </span>
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full border tracking-[0.2em] shadow-inner ${lead.technology_choice === 'IP' ? 'bg-purple-50 dark:bg-purple-500/5 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-500/10' : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700'}`}>
                          {lead.technology_choice}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {lead.status === "won" ? (
                        <div className="flex flex-col items-end">
                           <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-500/20">
                             Earned: ₹{lead.commission_amount.toLocaleString("en-IN")}
                           </span>
                           <span className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">
                             Quote Value: ₹{lead.total_payable.toLocaleString("en-IN")}
                           </span>
                        </div>
                      ) : ["quoted", "lost"].includes(lead.status) ? (
                        <span className="font-black text-zinc-500 text-sm">
                          ₹{lead.total_payable.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Pending Quote</span>
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
  );
}
