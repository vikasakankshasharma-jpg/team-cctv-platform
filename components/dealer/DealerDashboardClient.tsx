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
  CreditCard
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
}

export function DealerDashboardClient({ dealer, recentLeads, pipeline }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-50 dark:bg-zinc-950">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">TC</div>
            <div>
              <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">TEAM CCTV</h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Dealer Portal</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold transition-all">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button onClick={() => router.push("/dealer/leads")} className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-sm font-bold transition-all">
              <Users className="w-4 h-4" /> My Leads
            </button>
            <button onClick={() => router.push("/dealer/billing")} className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-sm font-bold transition-all">
              <CreditCard className="w-4 h-4" /> Billing
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
              {dealer.owner_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{dealer.owner_name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{dealer.company_name}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" /> {loggingOut ? "Signing out…" : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Welcome, {dealer.owner_name}</h1>
          <p className="text-sm text-zinc-500 font-medium">Here's what's happening in your territory today.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Leads", value: dealer.total_leads_received, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/10" },
            { label: "Sales Won", value: dealer.total_leads_won, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/10" },
            { label: "Commission Due", value: `₹${fmt(dealer.total_commission_due)}`, icon: IndianRupee, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10" },
            { label: "Conversion", value: `${dealer.total_leads_received ? Math.round((dealer.total_leads_won / dealer.total_leads_received) * 100) : 0}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/10" },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Leads Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" /> Recent Territory Leads
              </h3>
              <button onClick={() => router.push("/dealer/leads")} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">Customer</th>
                      <th className="px-6 py-3 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-3 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">Received</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {recentLeads.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-sm text-zinc-500 font-medium italic">
                          No leads assigned to your territory yet.
                        </td>
                      </tr>
                    ) : (
                      recentLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group" onClick={() => router.push(`/dealer/leads/${lead.id}`)}>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">{lead.customer_name}</p>
                            <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                              <Phone className="w-3 h-3" /> +91 {lead.mobile_number}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${statusColors[lead.status] || "bg-zinc-100 text-zinc-600"}`}>
                              {lead.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-zinc-500 font-bold whitespace-nowrap">
                            {formatDate(lead.created_at)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-500 transition-colors inline" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pipeline Sidebar */}
          <div className="space-y-4">
             <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" /> Sales Pipeline
              </h3>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
                 {[
                   { label: "New Leads", count: pipeline.new, color: "bg-blue-500", total: dealer.total_leads_received },
                   { label: "Quoted", count: pipeline.quoted, color: "bg-indigo-500", total: dealer.total_leads_received },
                   { label: "Won Deals", count: pipeline.won, color: "bg-emerald-500", total: dealer.total_leads_received },
                 ].map((p, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-zinc-500 uppercase tracking-widest">{p.label}</span>
                        <span className="text-zinc-900 dark:text-white">{p.count}</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${p.color} transition-all duration-1000`} 
                          style={{ width: `${p.total ? (p.count / p.total) * 100 : 0}%` }}
                        />
                      </div>
                   </div>
                 ))}

                 <hr className="border-zinc-100 dark:border-zinc-800 my-4" />
                 
                 <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/40">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                       <FileText className="w-3 h-3" /> Dealer Support
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                      Need help with a quote? Contact your assigned relationship manager at <span className="font-bold">+91 97726 99395</span>.
                    </p>
                 </div>
              </div>
          </div>

        </div>
      </main>

    </div>
  );
}
