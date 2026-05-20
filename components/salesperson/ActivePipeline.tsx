"use client";

import { useState, useTransition } from "react";
import { Phone, MessageSquare, ArrowUpRight, Clock, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Lead } from "@/types";

const STATUS_OPTIONS = [
  { value: "new",         label: "New",          color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { value: "contacted",   label: "Contacted",    color: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
  { value: "site_visit",  label: "Site Visit",   color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { value: "negotiation", label: "Negotiation",  color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
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
        const res = await fetch(`/api/leads/${leadId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) setStatus(prev); // Rollback on failure
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
          <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl p-1.5 min-w-[140px] animate-in fade-in zoom-in-95 duration-150">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleChange(opt.value)}
                className={`w-full flex items-center justify-between gap-2 text-left text-[10px] font-bold px-3 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${opt.color.split(" ")[1]}`}
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

export function ActivePipeline({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-[32px] py-20 text-center">
        <p className="text-zinc-500 font-bold italic">No active leads requiring immediate attention.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {leads.map((lead) => (
        <div key={lead.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-[28px] shadow-sm hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-[18px] bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors shrink-0 text-lg font-black">
              {(lead.customer_name ?? "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="text-base font-black text-zinc-900 dark:text-white tracking-tight truncate">{lead.customer_name}</h4>
                <StatusBadge status={lead.status} />
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
            <StatusDropdown leadId={lead.id!} currentStatus={lead.status} />
            <a href={`tel:${lead.mobile_number}`} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-500 transition-all border border-zinc-100 dark:border-zinc-700">
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
            <a href={`https://wa.me/91${lead.mobile_number}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all">
              <MessageSquare className="w-3.5 h-3.5" /> WA
            </a>
            <Link href={`/salesperson/leads`} className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-zinc-700 flex items-center justify-center text-white hover:bg-blue-600 transition-all shadow-lg">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
