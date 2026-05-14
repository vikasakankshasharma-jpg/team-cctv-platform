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
    new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    contacted: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    site_visit: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    quoted: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    lost: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button 
              onClick={() => router.push("/dealer/dashboard")}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs font-black uppercase tracking-widest transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Territory Leads</h1>
            <p className="text-sm text-zinc-500 font-medium mt-1">Manage and track leads assigned to your franchise territory.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/40">
               <ShieldCheck className="w-3 h-3" /> Exclusivity Active
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
             <Filter className="w-4 h-4 text-zinc-400" />
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
             >
               <option value="all">All Statuses</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {filteredLeads.length === 0 ? (
             <div className="col-span-full py-20 text-center">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Search className="w-8 h-8 text-zinc-300" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">No leads found</h3>
                <p className="text-sm text-zinc-500 font-medium">Try adjusting your search or filters.</p>
             </div>
           ) : (
             filteredLeads.map((lead) => (
               <div 
                 key={lead.id} 
                 onClick={() => router.push(`/dealer/leads/${lead.id}`)}
                 className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all cursor-pointer group flex flex-col"
               >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${statusColors[lead.status] || "bg-zinc-100 text-zinc-600"}`}>
                      {lead.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400">{formatDate(lead.created_at)}</span>
                  </div>

                  <h3 className="text-base font-black text-zinc-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors">{lead.customer_name}</h3>
                  
                  <div className="space-y-2 mb-6">
                     <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                        <Phone className="w-3.5 h-3.5" /> +91 {lead.mobile_number}
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                        <Building className="w-3.5 h-3.5 capitalize" /> {lead.property_type}
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                        <ExternalLink className="w-3.5 h-3.5" /> {lead.technology_choice} Technology
                     </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-zinc-50 dark:border-zinc-800 flex justify-between items-center">
                     <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        View Lead Details <ChevronRight className="w-3 h-3" />
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
