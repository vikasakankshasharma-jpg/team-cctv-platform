"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  ChevronRight, 
  Phone, 
  MapPin, 
  ExternalLink,
  ShieldCheck,
  Building
} from "lucide-react";

interface LeadItem {
  id: string;
  customer_name: string;
  mobile_number: string;
  status: string;
  property_type: string;
  technology_choice: string;
  created_at: string;
  sla_deadline?: string | null;
  sla_breached?: boolean;
}

interface Props {
  leads: LeadItem[];
  dealerId: string;
}

export function DealerLeadsClient({ leads }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.mobile_number.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    contacted: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    site_visit: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
    quoted: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20",
    won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    lost: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] -z-10 rounded-full" />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <button 
              onClick={() => router.push("/dealer/dashboard")}
              className="flex items-center gap-2 text-zinc-400 hover:text-zinc-950 dark:hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Hub
            </button>
            <h1 className="text-4xl font-black text-zinc-950 dark:text-white tracking-tighter uppercase mb-2">Territory Pipeline</h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-loose">Managing {leads.length} Active Records</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-500 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100 dark:border-emerald-500/20 shadow-sm shadow-emerald-500/5">
               <ShieldCheck className="w-4 h-4" /> Market Exclusivity
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 shadow-md shadow-zinc-200/40 dark:shadow-none">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
               <Filter className="w-4 h-4 text-zinc-400" />
             </div>
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-3.5 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900"
             >
               <option value="all">All States</option>
               <option value="new">New</option>
               <option value="contacted">Contacted</option>
               <option value="site_visit">Site Visit</option>
               <option value="quoted">Quoted</option>
               <option value="won">Won</option>
               <option value="lost">Lost</option>
             </select>
          </div>
        </div>

        {/* Leads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredLeads.length === 0 ? (
             <div className="col-span-full py-32 text-center">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl flex items-center justify-center mx-auto mb-6">
                   <Search className="w-8 h-8 text-zinc-300" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">No matching records</h3>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Broaden your search or adjust the filters</p>
             </div>
           ) : (
             filteredLeads.map((lead) => (
               <div 
                 key={lead.id} 
                 onClick={() => router.push(`/dealer/leads/${lead.id}`)}
                 className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-md shadow-zinc-200/50 dark:shadow-none hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all cursor-pointer group flex flex-col relative overflow-hidden"
               >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full group-hover:bg-blue-500/10 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-8">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${statusColors[lead.status] || "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                      {lead.status.replace("_", " ")}
                    </span>
                    
                    {/* SLA Logic */}
                    {lead.status === "new" && lead.sla_deadline ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">SLA Deadline</span>
                        {new Date(lead.sla_deadline).getTime() < Date.now() || lead.sla_breached ? (
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-1 rounded-lg animate-pulse">
                            ⚠️ SLA Breached
                          </span>
                        ) : new Date(lead.sla_deadline).getTime() - Date.now() < 30 * 60 * 1000 ? (
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-lg">
                            ⚠️ Approaching
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg">
                            {new Date(lead.sla_deadline).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{formatDate(lead.created_at)}</span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-zinc-950 dark:text-white mb-6 group-hover:text-blue-600 transition-colors tracking-tight uppercase leading-tight">{lead.customer_name}</h3>
                  
                  <div className="space-y-3.5 mb-10">
                     <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        <div className="w-7 h-7 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                           <Phone className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        +91 {lead.mobile_number}
                     </div>
                     <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        <div className="w-7 h-7 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                           <Building className="w-3.5 h-3.5 text-purple-500" />
                        </div>
                        {lead.property_type}
                     </div>
                     <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        <div className="w-7 h-7 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                           <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        {lead.technology_choice} Setup
                     </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-zinc-50 dark:border-zinc-800 flex justify-between items-center">
                     <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                        Execute Workflow <ChevronRight className="w-3.5 h-3.5" />
                     </span>
                  </div>
               </div>
             ))
           )}
        </div>

      </div>
    </div>
  );
}

