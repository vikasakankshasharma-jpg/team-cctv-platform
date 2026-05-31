"use client";

import { Copy, IndianRupee, Target, TrendingUp, CheckCircle2, ChevronRight, Activity, Clock, AlertTriangle, Map } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface PartnerDashboardClientProps {
  partnerName: string;
  referralCode: string;
  stats: {
    totalEarned: number;
    pendingPayout: number;
    totalPaid: number;
    totalLeads: number;
  };
  recentWins: {
    id: string;
    lead_id: string;
    customer_name: string;
    commission_amount: number;
    status: string;
    created_at: string;
  }[];
  pipeline?: {
    new: number;
    contacted: number;
    site_visit: number;
    quoted: number;
    won: number;
    lost: number;
  };
  slaBreachesCount?: number;
}

export function PartnerDashboardClient({ partnerName, referralCode, stats, recentWins, pipeline, slaBreachesCount = 0 }: PartnerDashboardClientProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CARDS = [
    { label: "Total Earned", value: `₹${stats.totalEarned.toLocaleString('en-IN')}`, icon: IndianRupee, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Pending Payout", value: `₹${stats.pendingPayout.toLocaleString('en-IN')}`, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Paid", value: `₹${stats.totalPaid.toLocaleString('en-IN')}`, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Total Referrals", value: stats.totalLeads.toString(), icon: Target, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* ── WELCOME BANNER ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 p-8 lg:p-10 shadow-xl dark:shadow-2xl">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Partner Dashboard</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
              Welcome back, <span className="text-amber-600 dark:text-amber-500">{partnerName}</span>.
            </h1>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-2 max-w-lg leading-relaxed">
              Here is the live overview of your referral pipeline and commission ledger. Share your referral code to increase earnings.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Your Referral Code</span>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handleCopy}
                className="group flex flex-col items-center justify-center bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 px-6 py-4 rounded-[20px] transition-all active:scale-95 h-[100px]"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-black text-amber-700 dark:text-amber-500 tracking-[0.2em]">{referralCode}</span>
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm">
                    <Copy className={`w-4 h-4 transition-colors ${copied ? "text-emerald-500" : "text-amber-500 dark:text-amber-400"}`} />
                  </div>
                </div>
                {copied && <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-2 animate-in slide-in-from-top-1">Copied Link!</span>}
              </button>

              <div className="w-[100px] h-[100px] bg-white rounded-[20px] p-2 shadow-inner border border-zinc-200 shrink-0 flex items-center justify-center">
                {typeof window !== "undefined" ? (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/?ref=' + referralCode)}`} 
                    alt="Referral QR Code" 
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-100 rounded-xl animate-pulse" />
                )}
              </div>
            </div>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right mt-1">Scan to open referral link</span>
          </div>
        </div>
      </div>

      {/* ── KPI GRID ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 rounded-[28px] p-6 shadow-lg shadow-zinc-200/20 dark:shadow-none hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
              <div className={`absolute -right-6 -top-6 w-24 h-24 ${card.bg} rounded-full blur-[40px] opacity-50 group-hover:opacity-100 transition-opacity`} />
              <div className="relative z-10 flex flex-col gap-4">
                <div className={`w-10 h-10 rounded-[14px] ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{card.label}</p>
                  <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PIPELINE TRACKER ──────────────────────────────────────────────── */}
      {pipeline && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] p-8 shadow-xl dark:shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Referral Pipeline</h2>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Real-time status of your referred leads</p>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { label: "New", value: pipeline.new, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
              { label: "Contacted", value: pipeline.contacted, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              { label: "Site Visit", value: pipeline.site_visit, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
              { label: "Quoted", value: pipeline.quoted, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
              { label: "Won", value: pipeline.won, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { label: "Lost", value: pipeline.lost, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
            ].map(stage => (
              <div key={stage.label} className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${stage.border} ${stage.bg} text-center`}>
                <span className={`text-2xl font-black ${stage.color}`}>{stage.value}</span>
                <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mt-2">{stage.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── SLA TRACKER ────────────────────────────────────────────────────── */}
        <div className="xl:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl flex flex-col">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">SLA Action Required</h2>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Acknowledge within 24h</p>
              </div>
            </div>
            <Link href="/partner/leads" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">
              View All
            </Link>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
             {slaBreachesCount > 0 ? (
               <>
                 <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 flex items-center justify-center text-red-500 mb-4 animate-pulse">
                   <AlertTriangle className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">{slaBreachesCount} Leads Escalated</h3>
                 <p className="text-sm font-medium text-zinc-500 mt-2 max-w-sm">
                   You have SLA breaches that require immediate attention.
                 </p>
               </>
             ) : (
               <>
                 <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-500 mb-4">
                   <CheckCircle2 className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">All Clear</h3>
                 <p className="text-sm font-medium text-zinc-500 mt-2 max-w-sm">
                   You have no pending leads requiring immediate SLA acknowledgment. Great work!
                 </p>
               </>
             )}
          </div>
        </div>

        {/* ── TERRITORY HEATMAP ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl flex flex-col">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950/40">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shadow-inner">
              <Map className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Territory Heatmap</h2>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Demand Hotspots</p>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col">
             <div className="flex-1 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800/50 flex items-center justify-center p-6 min-h-[200px]">
                <div className="grid grid-cols-5 gap-2 w-full h-full opacity-60">
                   {Array.from({ length: 25 }).map((_, i) => (
                     <div key={i} className={`rounded-lg ${Math.random() > 0.7 ? 'bg-amber-500/80 animate-pulse' : Math.random() > 0.4 ? 'bg-amber-500/30' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                   ))}
                </div>
             </div>
             <p className="text-[10px] font-bold text-center text-zinc-400 uppercase tracking-widest mt-4">Simulated Regional Activity</p>
          </div>
        </div>
      </div>

      {/* ── RECENT WINS ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl">
        <div className="p-6 lg:p-8 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shadow-inner">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Recent Captured Leads</h2>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Last 5 successful conversions</p>
            </div>
          </div>
          <Link href="/partner/commissions" className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
            View Ledger <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800/60 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
              <tr>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Customer</th>
                <th className="px-8 py-5 text-right">Commission Earned</th>
                <th className="px-8 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 font-medium">
              {recentWins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No captured leads yet</p>
                    <p className="text-zinc-500 text-sm mt-2">Share your code to start generating commissions.</p>
                  </td>
                </tr>
              ) : (
                recentWins.map((win) => (
                  <tr key={win.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-8 py-5 text-zinc-500 dark:text-zinc-400 font-bold text-[11px] tracking-widest uppercase">
                      {new Date(win.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">{win.customer_name}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="font-black text-emerald-600 dark:text-emerald-500 text-base">
                        ₹{win.commission_amount.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        win.status === "paid" 
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                          : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-500/20"
                      }`}>
                        {win.status === "paid" && <CheckCircle2 className="w-3 h-3" />}
                        {win.status === "pending" && <Clock className="w-3 h-3" />}
                        {win.status}
                      </span>
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
