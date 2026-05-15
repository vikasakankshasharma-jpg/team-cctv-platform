"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  IndianRupee, 
  TrendingUp, 
  LogOut, 
  MapPin, 
  Phone, 
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  Zap
} from "lucide-react";
import type { FranchiseDealer } from "@/types";

interface Props {
  dealer: FranchiseDealer & { id: string };
  recentLeads: {
    id: string;
    customer_name: string;
    mobile_number: string;
    status: string;
    created_at: string;
  }[];
  pipeline: Record<string, number>;
  leadVelocity: number;
  topPincodes: [string, number][];
}

export function DealerDashboardClient({ dealer, recentLeads, pipeline, leadVelocity, topPincodes }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // ... (handleLogout and helpers)
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/dealer/auth/session", { method: "DELETE" });
      router.push("/dealer/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingOut(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    contacted: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    site_visit: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    quoted: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    lost: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-30">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20">TC</div>
            <div>
              <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">TEAM CCTV</h2>
              <p className="text-[9px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest leading-none mt-0.5">Franchise Partner</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-zinc-900/10 dark:shadow-none transition-all">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </button>
            <button onClick={() => router.push("/dealer/leads")} className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
              <Users className="w-3.5 h-3.5" /> My Leads
            </button>
            <button onClick={() => router.push("/dealer/billing")} className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
              <CreditCard className="w-3.5 h-3.5" /> Billing
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-xs font-black text-white shadow-sm">
              {dealer.owner_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-zinc-900 dark:text-white truncate uppercase tracking-tight">{dealer.owner_name}</p>
              <p className="text-[9px] font-bold text-zinc-500 truncate uppercase tracking-widest">{dealer.company_name}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-4 py-3 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> {loggingOut ? "Signing out…" : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -z-10 rounded-full" />
        
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Active Territory Connection</span>
          </div>
          <h1 className="text-3xl font-black text-zinc-950 dark:text-white tracking-tighter mb-1 uppercase">Control Centre</h1>
          <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Territory: {dealer.company_name}</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Pipeline Depth", value: dealer.total_leads_received, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-100/50 dark:border-blue-500/20" },
            { label: "Successful Closure", value: dealer.total_leads_won, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-100/50 dark:border-emerald-500/20" },
            { label: "Territory Yield", value: `₹${fmt(dealer.total_commission_due)}`, icon: IndianRupee, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-100/50 dark:border-amber-500/20" },
            { label: "Lead Velocity", value: `${leadVelocity}/day`, icon: Zap, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/10", border: "border-purple-100/50 dark:border-purple-500/20" },
          ].map((stat, i) => (
            <div key={i} className={`bg-white dark:bg-zinc-900/50 backdrop-blur-xl border ${stat.border} rounded-3xl p-6 shadow-2xl shadow-zinc-200/50 dark:shadow-none group hover:scale-[1.02] transition-transform`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
              <p className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Leads Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-500" /> Recent Market Activity
              </h3>
              <button onClick={() => router.push("/dealer/leads")} className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest hover:underline">View Ledger</button>
            </div>
            
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl shadow-zinc-200/40 dark:shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800/60">
                    <tr>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">Customer Profile</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">Current State</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">Received</th>
                      <th className="px-8 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                    {recentLeads.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-[11px] text-zinc-500 font-black uppercase tracking-widest opacity-50">
                          Territory pipeline is currently empty
                        </td>
                      </tr>
                    ) : (
                      recentLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => router.push(`/dealer/leads/${lead.id}`)}>
                          <td className="px-8 py-5">
                            <p className="text-sm font-black text-zinc-950 dark:text-white mb-0.5 tracking-tight uppercase">{lead.customer_name}</p>
                            <p className="text-[10px] text-zinc-400 font-bold flex items-center gap-1.5 uppercase tracking-widest">
                              <Phone className="w-3 h-3 text-blue-400" /> {lead.mobile_number}
                            </p>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${statusColors[lead.status] || "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                              {lead.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-[11px] text-zinc-500 font-bold whitespace-nowrap tracking-tight">
                            {formatDate(lead.created_at)}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="w-8 h-8 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <ChevronRight className="w-4 h-4" />
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

          {/* Intelligence Sidebar */}
          <div className="space-y-8">
             <div className="space-y-4">
                <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2.5">
                   <TrendingUp className="w-4 h-4 text-purple-500" /> Closure Intelligence
                </h3>
                <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800 rounded-[32px] p-8 shadow-2xl shadow-zinc-200/40 dark:shadow-none space-y-6">
                   {[
                     { label: "New Leads", count: pipeline.new, color: "bg-blue-500", total: dealer.total_leads_received },
                     { label: "Quoted", count: pipeline.quoted, color: "bg-indigo-500", total: dealer.total_leads_received },
                     { label: "Won Deals", count: pipeline.won, color: "bg-emerald-500", total: dealer.total_leads_received },
                   ].map((p, i) => (
                     <div key={i} className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                          <span className="text-zinc-400">{p.label}</span>
                          <span className="text-zinc-950 dark:text-white">{p.count}</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800/60 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${p.color} transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]`} 
                            style={{ width: `${p.total ? (p.count / p.total) * 100 : 0}%` }}
                          />
                        </div>
                     </div>
                   ))}

                   <hr className="border-zinc-50 dark:border-zinc-800/60 my-6" />
                   
                   <div className="space-y-4">
                     <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Hot Territory Pincodes</p>
                     <div className="space-y-2">
                       {topPincodes.map(([pin, count]) => (
                         <div key={pin} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/60">
                           <div className="flex items-center gap-2">
                             <MapPin className="w-3 h-3 text-blue-500" />
                             <span className="text-[11px] font-black text-zinc-900 dark:text-white">{pin}</span>
                           </div>
                           <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest">{count} Leads</span>
                         </div>
                       ))}
                     </div>
                   </div>
                </div>
             </div>

             <div className="bg-gradient-to-br from-zinc-900 to-black dark:from-white dark:to-zinc-200 rounded-[32px] p-8 shadow-2xl text-white dark:text-zinc-950 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 blur-[60px] rounded-full" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-50">Enterprise Support</p>
                <h4 className="text-lg font-black tracking-tight mb-4 uppercase leading-tight">Priority Partner Assistance</h4>
                <p className="text-[11px] font-bold opacity-70 mb-6 leading-relaxed uppercase tracking-wider">
                  Contact your RM for high-value quotation approvals or onsite technical support.
                </p>
                <a href="tel:+919772699395" className="flex items-center justify-center gap-2 w-full py-4 bg-white/10 dark:bg-black/5 hover:bg-white/20 dark:hover:bg-black/10 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                  <Phone className="w-3.5 h-3.5" /> Call Manager
                </a>
             </div>
          </div>

        </div>
      </main>

    </div>
  );
}
