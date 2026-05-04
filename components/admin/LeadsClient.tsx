"use client";

import { useState } from "react";
import { Users, Eye, Phone, MapPin, Search, Filter, Loader2, Target, Zap, Waves, ChevronRight, History } from "lucide-react";
import type { Lead } from "@/types";
import { updateLeadStatus } from "@/app/actions/leads";
import Link from "next/link";
import { PageHeader } from "./PageHeader";
import { useRouter } from "next/navigation";
import { QuoteHistoryModal } from "./QuoteHistoryModal";

interface LeadsClientProps {
  initialLeads: Lead[];
  industrialLeads: any[];
  nextCursor?: string | null;
}

export function LeadsClient({ initialLeads, industrialLeads, nextCursor }: LeadsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"standard" | "industrial">("standard");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [historyLead, setHistoryLead] = useState<{ id: string, name: string } | null>(null);

  const currentDataset = activeTab === "standard" ? initialLeads : industrialLeads;

  const filteredLeads = currentDataset.filter(lead => {
    const searchStr = activeTab === "standard" 
      ? (lead as Lead).customer_name + lead.mobile_number
      : (lead as any).phone;
      
    const matchesSearch = searchStr.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setIsUpdating(leadId);
    try {
      await updateLeadStatus(leadId, newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(null);
    }
  };

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Tab Orchestrator */}
      <div className="flex items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[24px] w-fit shadow-inner">
        <button
          onClick={() => setActiveTab("standard")}
          className={`px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === "standard" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xl shadow-zinc-950/20 border border-zinc-200 dark:border-zinc-700" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
        >
          Standard Matrix
        </button>
        <button
          onClick={() => setActiveTab("industrial")}
          className={`px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === "industrial" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xl shadow-zinc-950/20 border border-zinc-200 dark:border-zinc-700" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
        >
          Industrial Inquiries
        </button>
      </div>

      {/* Search & Filter Orchestrator */}
      <div className="flex flex-col lg:flex-row gap-6 items-end justify-between px-2">
        <div className="flex flex-1 gap-4 w-full max-w-3xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              placeholder={activeTab === "standard" ? "Query Spectrum (Name, Mobile...)" : "Query Mobile..."}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/60 text-zinc-900 dark:text-white rounded-[24px] pl-14 pr-6 py-5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold placeholder-zinc-400 dark:placeholder-zinc-700 shadow-inner"
            />
          </div>
          <div className="relative w-64 group">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-blue-500 pointer-events-none transition-colors" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/60 text-zinc-900 dark:text-white rounded-[24px] pl-14 pr-10 py-5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all appearance-none cursor-pointer font-black uppercase tracking-widest shadow-inner shadow-zinc-900/5 dark:shadow-none"
            >
              <option value="all">Global Status</option>
              <option value="new">Incoming (New)</option>
              <option value="contacted">Synthesized</option>
              <option value="site_visit">Deployment</option>
              <option value="quoted">Finalizing</option>
              <option value="won">Captured</option>
              <option value="lost">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl backdrop-blur-md transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-600 font-black uppercase text-[10px] tracking-[0.25em]">
              <tr>
                <th className="px-8 py-6">{activeTab === "standard" ? "Identity & Contact" : "Contact Details"}</th>
                <th className="px-8 py-6">{activeTab === "standard" ? "Topology & Optic" : "Volume Requirements"}</th>
                <th className="px-8 py-6">{activeTab === "standard" ? "Geo-Logistics" : "Site Archetype"}</th>
                <th className="px-8 py-6">{activeTab === "standard" ? "Source Origin" : "Captured At"}</th>
                <th className="px-8 py-6 text-center">Lifecycle Status</th>
                <th className="px-8 py-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-700 shadow-inner">
                         <Users className="w-8 h-8" />
                       </div>
                       <div className="space-y-1">
                         <p className="font-black text-xl text-zinc-900 dark:text-white tracking-widest uppercase">No Subjects Found</p>
                         <p className="text-zinc-400 dark:text-zinc-600 text-xs font-bold uppercase tracking-tight">The lead matrix is currently empty for this query.</p>
                       </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all group/row">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-zinc-900 dark:text-white text-lg leading-none tracking-tight group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors uppercase">
                            {activeTab === "standard" ? (lead as Lead).customer_name : "Industrial Lead"}
                          </span>
                          {(lead as Lead).wizard_answers?.q_timeline === 'asap' && (
                            <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] px-2 py-0.5 rounded-full uppercase tracking-widest">Urgent</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 font-black tracking-widest uppercase">
                          <Phone className="w-3.5 h-3.5 text-blue-500/50" /> {activeTab === "standard" ? (lead as Lead).mobile_number : (lead as any).phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {activeTab === "standard" ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <span className="capitalize font-black text-[9px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/5 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/10 tracking-widest shadow-inner">
                               {(lead as Lead).property_type}
                            </span>
                            <span className={`text-[9px] font-black px-3 py-1 rounded-full border tracking-[0.2em] shadow-inner ${(lead as Lead).technology_choice === 'IP' ? 'bg-purple-50 dark:bg-purple-500/5 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-500/10' : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700'}`}>
                              {(lead as Lead).technology_choice}
                            </span>
                          </div>
                          {(() => {
                            const surfaces = (lead as Lead).wizard_answers?.q_surface;
                            const hasHazards = Array.isArray(surfaces) && surfaces.some(s => s === 'metal' || s === 'premium');
                            if (hasHazards) {
                              return <span className="text-[8px] text-amber-500 font-bold uppercase flex items-center gap-1 w-fit"><Zap className="w-3 h-3"/> Surface Hazard: Metal/Premium</span>
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="font-black text-xs text-blue-600 dark:text-blue-400">
                             {(lead as any).requested_camera_count} Units
                          </span>
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                            {(lead as any).technology}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {activeTab === "standard" ? (
                        (lead as Lead).address ? (
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col min-w-[140px]">
                              <div className="flex items-center gap-2 text-zinc-900 dark:text-white text-[11px] font-black tracking-widest uppercase">
                                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" /> {(lead as Lead).address!.pincode}
                              </div>
                              <div className="text-zinc-400 dark:text-zinc-600 text-[9px] font-black mt-1.5 uppercase tracking-wide truncate max-w-[160px] italic">
                                  {(lead as Lead).address!.landmark1 || "No Landmark Recorded"}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-800 text-[10px] font-black uppercase tracking-[0.2em]">Geo-Unlinked</span>
                        )
                      ) : (
                        <span className="capitalize font-black text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                          {(lead as any).property_type}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {activeTab === "standard" ? (
                        (lead as Lead).referral_code ? (
                          <div className="flex flex-col">
                            <span className="text-amber-700 dark:text-amber-500 font-black text-[10px] tracking-[0.25em] uppercase whitespace-nowrap bg-amber-50 dark:bg-amber-500/5 px-2 py-1 rounded border border-amber-100 dark:border-amber-500/10 w-fit">
                              {(lead as Lead).referral_code}
                            </span>
                            <div className="mt-2 flex flex-col gap-0.5">
                               <span className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                                  {(lead as Lead).promoter_name || "Unknown Agent"}
                               </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-700 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 ml-1">
                             <Waves className="w-3 h-3" /> Organic Cycle
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                          {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="relative group/status inline-block">
                         <select 
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id!, e.target.value)}
                          disabled={isUpdating === lead.id}
                          className={`appearance-none font-black text-[10px] uppercase px-5 py-2.5 rounded-full border cursor-pointer transition-all outline-none text-center pr-2 shadow-inner group-hover/status:border-opacity-100 ${getStatusColor(lead.status)} ${isUpdating === lead.id ? 'opacity-50' : ''}`}
                         >
                           <option value="new">Incoming</option>
                           <option value="contacted">Synthesized</option>
                           <option value="site_visit">Deployment</option>
                           <option value="quoted">Finalizing</option>
                           <option value="won">Captured</option>
                           <option value="lost">Terminated</option>
                         </select>
                         {isUpdating === lead.id && (
                           <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400" />
                         )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {activeTab === "standard" ? (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center justify-end">
                            <Link 
                              href={`/quote/${lead.id}`} 
                              target="_blank"
                              className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-white dark:hover:text-white bg-blue-500/10 hover:bg-zinc-900 dark:hover:bg-blue-600 border border-blue-500/20 hover:border-zinc-900 dark:hover:border-blue-500/30 rounded-xl transition-all shadow-inner active:scale-95" 
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Quote</span>
                            </Link>
                            <button 
                              onClick={() => setHistoryLead({ id: lead.id!, name: (lead as Lead).customer_name })}
                              className="w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-amber-500 hover:border-amber-500/30 rounded-xl transition-all shadow-inner active:scale-90 ml-2"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </div>
                          {(lead as Lead).competitor_quote_url && (
                            <a 
                              href={(lead as Lead).competitor_quote_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-amber-500 hover:underline"
                            >
                              <Target className="w-3 h-3" /> Competitor Quote Attached
                            </a>
                          )}
                        </div>
                      ) : (
                        <a 
                          href={`tel:+91${(lead as any).phone}`}
                          className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/20 rounded-xl transition-all shadow-inner active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Lead</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controller */}
      {nextCursor && activeTab === "standard" && (
        <div className="flex justify-center mt-12">
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("lastDate", nextCursor);
              router.push(url.pathname + url.search);
            }}
            className="group flex items-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-10 py-4 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] transition-all hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white shadow-xl active:scale-95"
          >
            Load Next Batch
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {historyLead && (
        <QuoteHistoryModal
          isOpen={!!historyLead}
          onClose={() => setHistoryLead(null)}
          leadId={historyLead.id}
          customerName={historyLead.name}
        />
      )}
    </div>
  );
}
