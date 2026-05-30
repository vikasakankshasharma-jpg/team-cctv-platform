"use client";

import { useState, useTransition } from "react";
import { Phone, MessageSquare, ArrowUpRight, Clock, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Lead } from "@/types";
import { updateLeadStatus, claimBroadcastedLead } from "@/app/actions/leads";
import { toast } from "sonner";


const STATUS_OPTIONS = [
  { value: "new",         label: "New",          color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { value: "contacted",   label: "Contacted",    color: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
  { value: "site_visit",  label: "Site Visit",   color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { value: "negotiation", label: "Negotiation",  color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
  { value: "quoted",      label: "Quoted",       color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  { value: "won",         label: "Won",          color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { value: "lost",        label: "Lost",         color: "bg-red-500/10 text-red-500 border-red-500/20" },
] as const;

function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find(o => o.value === status);
  return (
    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${opt?.color ?? "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
      {opt?.label ?? status}
    </span>
  );
}

function StatusDropdown({ leadId, currentStatus }: { leadId: string; currentStatus: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleChange = async (newStatus: string) => {
    setOpen(false);
    const prev = status;
    setStatus(newStatus); // Optimistic update
    startTransition(async () => {
      try {
        await updateLeadStatus(leadId, newStatus);
      } catch {
        setStatus(prev);
      }
    });
  };

  const current = STATUS_OPTIONS.find(o => o.value === status);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isPending}
        className={`flex items-center gap-1.5 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border transition-all ${current?.color ?? "bg-zinc-100 text-zinc-500 border-zinc-200"} ${isPending ? "opacity-50" : "hover:opacity-80"}`}
      >
        {isPending ? "…" : current?.label ?? status}
        <ChevronDown className="w-2.5 h-2.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-[#030303]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-1.5 min-w-[140px] animate-in fade-in zoom-in-95 duration-150">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleChange(opt.value)}
                className={`w-full flex items-center justify-between gap-2 text-left text-[10px] font-bold px-3 py-2 rounded-xl hover:bg-white/10 transition-colors ${opt.color.split(" ")[1]}`}
              >
                {opt.label}
                {opt.value === status && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function InstallerPipeline({ leads, partnerId, partnerName, role = "salesperson" }: { leads: Lead[], partnerId?: string, partnerName?: string, role?: "salesperson" | "installer" }) {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (leadId: string) => {
    if (!partnerId || !partnerName) return;
    setClaimingId(leadId);
    try {
      const res = await claimBroadcastedLead(leadId, partnerId, partnerName, role);
      if (res.success) {
        toast.success("Lead claimed successfully!");
      } else {
        toast.error(res.error || "Failed to claim lead. Someone else might have claimed it first.");
      }
    } catch (e) {
      toast.error("Failed to claim lead.");
    } finally {
      setClaimingId(null);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="bg-white/5 border border-dashed border-white/20 rounded-[32px] py-20 text-center">
        <p className="text-zinc-400 font-bold italic">No active leads requiring immediate attention.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {leads.map((lead) => {
        const isBroadcast = role === "salesperson" 
          ? !lead.assigned_salesperson_id && lead.broadcasted_to_installer_ids?.includes(partnerId || "")
          : !lead.assigned_installer_id && lead.broadcasted_to_installer_ids?.includes(partnerId || "");

        return (
          <div key={lead.id} className={`backdrop-blur-xl border p-6 rounded-[28px] transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isBroadcast ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center transition-colors shrink-0 text-lg font-black border ${isBroadcast ? 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30' : 'bg-white/5 text-zinc-400 group-hover:bg-blue-500/10 group-hover:text-blue-500 border-white/5'}`}>
                {(lead.customer_name ?? "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-base font-black text-white tracking-tight truncate">{lead.customer_name}</h4>
                  <StatusBadge status={lead.status} />
                  {isBroadcast && (
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                      Urgent • Claim Now
                    </span>
                  )}
                  {lead.price_match_status === 'pending' && (
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse">
                      Price Match
                    </span>
                  )}
                  {lead.is_escalated && (
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border bg-red-500/20 text-red-500 border-red-500/30 animate-pulse">
                      Escalated
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(lead.created_at as Date)} ago</span>
                  <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                  <span>{lead.property_type ?? "Residential"}</span>
                  {lead.mobile_number && (
                    <>
                      <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                      <span>{lead.mobile_number}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              {isBroadcast ? (
                <button 
                  onClick={() => handleClaim(lead.id!)}
                  disabled={claimingId === lead.id}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-500 text-black font-black text-[10px] uppercase tracking-widest hover:bg-indigo-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all hover:scale-105"
                >
                  {claimingId === lead.id ? "Claiming..." : "Claim Lead"}
                </button>
              ) : (
                <>
                  <StatusDropdown leadId={lead.id!} currentStatus={lead.status} />
                  <a href={`tel:${lead.mobile_number}`} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-500 transition-all border border-white/10 hover:border-emerald-500/30">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                  <a href={`https://wa.me/91${lead.mobile_number}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
                    <MessageSquare className="w-3.5 h-3.5" /> WA
                  </a>
                  <Link href={`/${role}/leads`} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-blue-600 transition-all shadow-lg hover:border-blue-500/50">
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
