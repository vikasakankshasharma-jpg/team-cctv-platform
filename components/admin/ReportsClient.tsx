"use client";

import { useState } from "react";
import { Download, Calendar, TrendingUp } from "lucide-react";
import type { Lead, PricingResult } from "@/types";
import { PageHeader } from "./PageHeader";
import { AnalyticsChart } from "./AnalyticsChart";

interface ReportEntry {
  lead: Lead;
  quote: PricingResult;
}

interface ReportsClientProps {
  data: ReportEntry[];
  aggregates: {
    avgQuoteValue: number;
    ipCount: number;
    hdCount: number;
    topAddon: { name: string; percentage: string };
    revenueTrend: { date: string; value: number }[];
  };
}

export function ReportsClient({ data: allData, aggregates }: ReportsClientProps) {
  const [dateFilter, setDateFilter] = useState("");

  // Apply date filter to data
  const data = allData.filter(({ lead }) => {
    if (!dateFilter) return true;
    const daysAgo = dateFilter === "year" ? 365 : parseInt(dateFilter);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysAgo);
    const createdAt = (lead.created_at as any)?.seconds
      ? new Date((lead.created_at as any).seconds * 1000)
      : new Date(lead.created_at as string);
    return createdAt >= cutoff;
  });

  const exportToCSV = () => {
    // CSV Headers
    const headers = [
      "Customer Name",
      "Mobile",
      "Property Type",
      "Tech Choice",
      "Promoter Name",
      "Business Name",
      "Net Taxable (₹)",
      "Total Payable (₹)",
      "Plan",
      "Created At"
    ];

    // Data rows
    const rows = data.map(({ lead, quote }) => [
      `"${lead.customer_name}"`,
      `"${lead.mobile_number}"`,
      lead.property_type,
      lead.technology_choice,
      (lead as any).promoter_name || "ORGANIC",
      (lead as any).promoter_business || "-",
      quote.net_taxable_amount,
      quote.total_payable,
      quote.plan_type,
      new Date(((lead.created_at as any)?.seconds ? (lead.created_at as any).seconds * 1000 : lead.created_at) as string | number | Date).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `TEAM_Reports_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <PageHeader
        icon={TrendingUp}
        title="Predictive Analytics"
        description="Performance intelligence and market saturation matrices across the Catalyst pipeline."
        badge={`${data.length} Resolved Deals`}
        action={
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-500 pointer-events-none transition-colors" />
              <select
                className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/60 text-zinc-900 dark:text-white rounded-[20px] pl-11 pr-10 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all appearance-none cursor-pointer shadow-inner"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="year">Full year</option>
              </select>
            </div>
            <button
              onClick={exportToCSV}
              className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              Matrix Export
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 hover:border-blue-500/40 rounded-[32px] p-8 overflow-hidden group transition-all backdrop-blur-md shadow-lg dark:shadow-2xl">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.05] dark:opacity-[0.03] group-hover:opacity-[0.1] dark:group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-110">
            <TrendingUp className="w-40 h-40 text-blue-500" />
          </div>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] mb-4">Avg Transaction Yield</p>
          <p className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">₹{aggregates.avgQuoteValue.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-2 mt-6">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">{data.length} High-Value Closures</p>
          </div>
        </div>

        <div className="relative bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 hover:border-indigo-500/40 rounded-[32px] p-8 overflow-hidden group transition-all backdrop-blur-md shadow-lg dark:shadow-2xl">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.05] dark:opacity-[0.03] group-hover:opacity-[0.1] dark:group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-110">
            <TrendingUp className="w-40 h-40 text-indigo-500" />
          </div>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] mb-4">Topology Saturation</p>
          <div className="space-y-5 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">IP Smart Mesh</span>
              <span className="text-3xl font-black text-zinc-900 dark:text-white">{data.length > 0 ? Math.round((aggregates.ipCount / data.length) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-950/60 h-2 rounded-full overflow-hidden shadow-inner border border-zinc-200 dark:border-zinc-800/40">
              <div
                className="bg-gradient-to-r from-indigo-600 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(79,70,229,0.3)] dark:shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                style={{ width: `${data.length > 0 ? (aggregates.ipCount / data.length) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                <span>HD Analog Cycle</span>
                <span className="text-zinc-500 dark:text-zinc-400">{data.length > 0 ? Math.round((aggregates.hdCount / data.length) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        <div className="relative bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 hover:border-amber-500/40 rounded-[32px] p-8 overflow-hidden group transition-all backdrop-blur-md shadow-lg dark:shadow-2xl">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.05] dark:opacity-[0.03] group-hover:opacity-[0.1] dark:group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-110">
            <TrendingUp className="w-40 h-40 text-amber-500" />
          </div>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] mb-4">Dominant Catalyst</p>
          <div className="mt-4">
            <p className="text-2xl font-black text-amber-600 dark:text-amber-500 leading-tight group-hover:scale-105 origin-left transition-transform uppercase tracking-tighter">{aggregates.topAddon.name}</p>
            <div className="flex items-center gap-3 mt-6">
                <span className="text-[9px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-500/20 uppercase tracking-[0.2em]">
                    {aggregates.topAddon.percentage} Yield Rate
                </span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart 
          data={aggregates.revenueTrend} 
          title="Revenue Acquisition Flow" 
        />
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] p-8 backdrop-blur-md shadow-xl flex flex-col justify-center gap-6">
           <div>
              <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] mb-1">Portfolio Balance</h3>
              <p className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Asset Distribution Matrix</p>
           </div>
           <div className="space-y-4">
              {['Home', 'Office', 'Shop', 'Warehouse', 'Bungalow', 'Factory', 'Other'].map(type => {
                const count = data.filter(d => d.lead.property_type === type.toLowerCase()).length;
                const percent = data.length > 0 ? (count / data.length) * 100 : 0;
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                       <span className="text-zinc-500">{type}</span>
                       <span className="text-zinc-900 dark:text-white">{count} Units</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden">
                       <div className="h-full bg-zinc-900 dark:bg-blue-600 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
           </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h2 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-3">
             <div className="w-10 h-[1px] bg-zinc-200 dark:bg-zinc-800" />
             Transaction Ledger
           </h2>
           <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-950/40 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800/60 shadow-inner">
             {data.length} Verified Entries
           </span>
        </div>
        
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl backdrop-blur-md transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-600 uppercase text-[10px] tracking-[0.25em] font-black">
                <tr>
                  <th className="px-8 py-6">Identity & Segment</th>
                  <th className="px-8 py-6">Architecture</th>
                  <th className="px-8 py-6">Source Origin</th>
                  <th className="px-8 py-6 text-right">Net Metric</th>
                  <th className="px-8 py-6 text-right">Execution Total</th>
                  <th className="px-8 py-6 text-center">Manifest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-32 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-50">
                          <TrendingUp className="w-12 h-12 text-zinc-300 dark:text-zinc-800" />
                          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">No Intelligence Data Mapped</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  data.map(({ lead, quote }) => (
                    <tr key={lead.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all group/row">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="font-black text-zinc-900 dark:text-white group-hover/row:text-blue-600 dark:group-hover/row:text-blue-500 transition-colors text-base tracking-tight">{lead.customer_name}</span>
                           <span className="text-[9px] text-zinc-400 dark:text-zinc-600 mt-2 uppercase tracking-[0.2em] font-black flex items-center gap-2">
                               {lead.property_type} <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" /> {lead.mobile_number}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] font-black px-4 py-1.5 rounded-full border tracking-widest shadow-inner ${
                          lead.technology_choice === 'IP'
                            ? "bg-blue-50 dark:bg-blue-500/5 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/10"
                            : "bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 border-zinc-100 dark:border-zinc-800/60"
                        }`}>
                          {lead.technology_choice === 'IP' ? "IP SMART MESH" : "HD ANALOG CYCLE"}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-amber-600 dark:text-amber-500/80 uppercase tracking-[0.2em]">{(lead as any).promoter_name || "ORGANIC"}</span>
                           <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-700 uppercase tracking-tighter mt-1">{(lead as any).promoter_business || "Direct Acquisition"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-zinc-400 dark:text-zinc-500 text-sm">₹{quote.net_taxable_amount.toLocaleString('en-IN')}</span>
                          <span className="text-[8px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-widest mt-1 italic">Pre-Tax Basis</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter group-hover/row:text-emerald-600 dark:group-hover/row:text-emerald-500 transition-colors">₹{quote.total_payable.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button className="w-11 h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:text-blue-600 dark:hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-500/30 flex items-center justify-center mx-auto transition-all shadow-inner active:scale-95 group/btn">
                           <Download className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </button>
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
