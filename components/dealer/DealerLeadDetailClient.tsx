"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  ExternalLink, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import type { Lead, Quote } from "@/types";

interface Props {
  lead: Lead & { id: string; created_at: string };
  quotes: (Quote & { id: string; created_at: string })[];
}

export function DealerLeadDetailClient({ lead, quotes }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [updating, setUpdating] = useState(false);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/dealer/leads/${lead.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Lead status updated successfully");
      router.refresh();
    } catch (err) {
      toast.error("Failed to update status");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const statusOptions = [
    { value: "new", label: "New", color: "bg-blue-500" },
    { value: "contacted", label: "Contacted", color: "bg-amber-500" },
    { value: "site_visit", label: "Site Visit", color: "bg-purple-500" },
    { value: "quoted", label: "Quoted", color: "bg-indigo-500" },
    { value: "won", label: "Won", color: "bg-emerald-500" },
    { value: "lost", label: "Lost", color: "bg-rose-500" },
  ];

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-IN", { 
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" 
    });
  };

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

  return (
    <div className="min-h-screen p-4 md:p-8 text-white">
      <div className="max-w-5xl mx-auto relative">
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] -z-10 rounded-full pointer-events-none" />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <button 
              onClick={() => router.push("/dealer/leads")}
              className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> All Leads
            </button>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-black text-white">{lead.customer_name}</h1>
               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                 status === "won" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                 status === "lost" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                 "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
               }`}>
                 {status.replace("_", " ")}
               </span>
            </div>
            <p className="text-sm text-zinc-500 font-bold mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Received on {formatDate(lead.created_at)}
            </p>
          </div>

          <div className="flex flex-col gap-3">
             <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Update Lead Status</p>
                <div className="flex items-center gap-2">
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="flex-1 bg-[#030303] border border-white/10 rounded-lg py-2 px-3 text-xs font-bold text-white outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleUpdateStatus}
                    disabled={updating || status === lead.status}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 rounded-lg transition-all shadow-lg"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </button>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Left Col - Details */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* Contact Information */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-500" /> Customer Contact
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mobile Number</p>
                       <a href={`tel:+91${lead.mobile_number}`} className="text-lg font-black text-white hover:text-blue-400 transition-colors flex items-center gap-2">
                         +91 {lead.mobile_number} <ExternalLink className="w-4 h-4 opacity-30" />
                       </a>
                    </div>
                    {lead.address && (
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Installation Address</p>
                         <p className="text-sm font-bold text-white leading-relaxed">
                            {lead.address.full_address}
                            <span className="block text-xs text-zinc-500 font-medium mt-1">Pincode: {lead.address.pincode}</span>
                         </p>
                      </div>
                    )}
                 </div>
              </div>

              {/* Requirement Summary */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" /> Requirement Summary
                 </h3>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                       <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Property</p>
                       <p className="text-sm font-black text-white capitalize">{lead.property_type}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                       <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Technology</p>
                       <p className="text-sm font-black text-white">{lead.technology_choice}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                       <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Cabling Status</p>
                       <p className="text-sm font-black text-white">{lead.cabling_done ? "Done" : "Pending"}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                       <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Site Visit</p>
                       <p className="text-sm font-black text-white">{lead.site_visit_date ? "Requested" : "No"}</p>
                    </div>
                 </div>
              </div>

              {/* Quotes Section */}
              <div className="space-y-4">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" /> Quotations Generated
                 </h3>
                 {quotes.length === 0 ? (
                    <div className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-8 text-center">
                       <p className="text-sm text-zinc-400 font-medium italic">No quotations have been generated for this lead yet.</p>
                    </div>
                 ) : (
                    <div className="space-y-3">
                       {quotes.map((q) => (
                          <div key={q.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-indigo-500/50 transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                   <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                   <p className="text-sm font-black text-white">Quote #{q.id.slice(-6).toUpperCase()}</p>
                                   <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{formatDate(q.created_at)}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-6">
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Total Quote</p>
                                   <p className="text-base font-black text-white">₹{fmt(q.total_payable || 0)}</p>
                                </div>
                                <a 
                                  href={`/quote/${lead.id}/review/${q.id}`} 
                                  target="_blank" 
                                  className="p-2 bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all"
                                  title="View Customer Link"
                                >
                                   <ExternalLink className="w-4 h-4" />
                                </a>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

           </div>

            {/* Right Col - Exclusivity / Trust */}
            <div className="space-y-6">
               <div className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-2 text-emerald-400 mb-4">
                     <ShieldCheck className="w-5 h-5" />
                     <h4 className="text-sm font-black uppercase tracking-widest">Territory Exclusive</h4>
                  </div>
                  <p className="text-xs text-emerald-400/70 font-medium leading-relaxed mb-4">
                     This lead was automatically routed to you based on the customer&apos;s pincode. You have exclusive rights to serve this inquiry.
                  </p>
                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
                     <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Assigned Zone</p>
                     <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {lead.address?.pincode || "N/A"}
                     </p>
                  </div>
               </div>

               <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Dealer Responsibilities</h4>
                  <ul className="space-y-4">
                     {[
                        { icon: Phone, text: "Call the customer within 2 hours of receiving the lead.", color: "text-blue-400" },
                        { icon: Calendar, text: "Coordinate a physical site visit for exact wiring measurement.", color: "text-purple-400" },
                        { icon: CheckCircle2, text: "Update lead status to 'Won' once payment is collected.", color: "text-emerald-400" },
                     ].map((item, i) => (
                        <li key={i} className="flex gap-3">
                           <item.icon className={`w-4 h-4 shrink-0 mt-0.5 ${item.color}`} />
                           <p className="text-[11px] text-zinc-400 font-semibold leading-normal">{item.text}</p>
                        </li>
                     ))}
                  </ul>
               </div>
            </div>

        </div>

      </div>
    </div>
  );
}
