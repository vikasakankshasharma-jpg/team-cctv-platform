"use client";

import React, { useState } from "react";
import { Lead } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, MessageCircle, MapPin, Eye, Zap } from "lucide-react";
import Link from "next/link";
import { updateLeadStatus } from "@/app/actions/leads";
import { useTranslation } from "@/hooks/useTranslation";

interface KanbanBoardProps {
  leads: Lead[];
  onStatusChange: (leadId: string, newStatus: string) => Promise<void>;
  isAdmin?: boolean;
  onLeadClick?: (lead: Lead) => void;
}

const COLUMNS = [
  { id: "new", titleKey: "adm_lc_incoming", defaultTitle: "Incoming", color: "bg-blue-500/10 border-blue-200 text-blue-700" },
  { id: "attempted", titleKey: "adm_lc_st_attempted", defaultTitle: "Attempted", color: "bg-orange-500/10 border-orange-200 text-orange-700" },
  { id: "contacted", titleKey: "adm_leads_st_contacted", defaultTitle: "Contacted", color: "bg-amber-500/10 border-amber-200 text-amber-700" },
  { id: "unreachable", titleKey: "adm_lc_st_unreach", defaultTitle: "Unreachable", color: "bg-rose-500/10 border-rose-200 text-rose-700" },
  { id: "busy", titleKey: "adm_lc_st_busy", defaultTitle: "Busy", color: "bg-yellow-500/10 border-yellow-200 text-yellow-700" },
  { id: "technical_error", titleKey: "adm_lc_st_techerr", defaultTitle: "Technical Error", color: "bg-red-500/10 border-red-200 text-red-700" },
  { id: "site_visit", titleKey: "adm_fu_act_visit", defaultTitle: "Site Visit", color: "bg-purple-500/10 border-purple-200 text-purple-700" },
  { id: "quoted", titleKey: "adm_lc_st_requote", defaultTitle: "Re-Quote", color: "bg-zinc-500/10 border-zinc-200 text-zinc-700" },
  { id: "won", titleKey: "adm_leads_tab_won", defaultTitle: "Won / Paid", color: "bg-emerald-500/10 border-emerald-200 text-emerald-700" },
  { id: "lost", titleKey: "adm_leads_st_lost", defaultTitle: "Lost", color: "bg-red-500/10 border-red-200 text-red-700" },
];

export function KanbanBoard({ leads, onStatusChange, isAdmin, onLeadClick }: KanbanBoardProps) {
  const { t } = useTranslation();
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = async (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    setDraggedLeadId(null);
    if (leadId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead && lead.status !== statusId) {
        await onStatusChange(leadId, statusId);
      }
    }
  };

  const openWhatsApp = (lead: Lead) => {
    const text = encodeURIComponent(`Hi ${lead.customer_name},\n\nI am reaching out from TEAM CCTV regarding your recent inquiry for a security system.\n\nAre you available for a quick chat?`);
    window.open(`https://wa.me/91${lead.mobile_number}?text=${text}`, "_blank");
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x">
      {COLUMNS.map(col => {
        const columnLeads = leads.filter(l => l.status === col.id);
        
        return (
          <div 
            key={col.id} 
            className="flex-none w-[320px] bg-secondary/20 rounded-xl border border-border/50 flex flex-col h-[650px] snap-center"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className={`px-4 py-3 border-b border-border/50 flex items-center justify-between gap-2 rounded-t-xl ${col.color.split(' ')[0]}`}>
              <h3 className={`font-bold text-sm tracking-tight leading-snug min-w-0 ${col.color.split(' ')[2]}`}>
                {t(col.titleKey, col.defaultTitle)}
              </h3>
              <Badge variant="secondary" className="bg-white/50 text-xs shadow-sm shrink-0">
                {columnLeads.length}
              </Badge>
            </div>

            {/* Column Body */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-none">
              {columnLeads.map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id!)}
                  onDragEnd={() => setDraggedLeadId(null)}
                  onClick={() => onLeadClick?.(lead)}
                  className={`bg-card border ${draggedLeadId === lead.id ? 'border-primary/50 opacity-50 scale-95' : 'border-border shadow-sm'} rounded-lg p-3.5 cursor-pointer active:cursor-grabbing transition-all hover:shadow-md hover:border-primary/50 group`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm text-foreground tracking-tight truncate pr-2">
                      {lead.customer_name}
                    </span>
                    {lead.wizard_answers?.q_timeline === 'asap' && (
                      <Zap className="w-3.5 h-3.5 text-warning shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-3">
                    <Phone className="w-3 h-3 shrink-0" /> 
                    {lead.mobile_number}
                  </div>

                  {lead.address && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-3 truncate">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-primary/60" />
                      <span className="truncate">{lead.address.pincode} - {lead.address.landmark1 || t("adm_lc_no_landmark", "No Landmark")}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <Badge variant="secondary" className="capitalize text-[9px] font-semibold tracking-wider leading-snug">
                      {lead.property_type}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold text-primary border-primary/30 leading-snug">
                      {lead.technology_choice}
                    </Badge>
                    {(() => {
                      const tl = (lead.timeline || (lead.wizard_answers?.q_timeline as string) || (lead.wizard_answers?.timeline as string) || "").toLowerCase();
                      if (tl === "asap" || tl.includes("immediately") || lead.priority === "HOT") {
                        return <Badge className="bg-red-500 hover:bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 whitespace-normal leading-snug">{t("adm_leads_tl_asap", "⚡ ASAP (1-2 Days)")}</Badge>;
                      }
                      if (tl === "week" || tl.includes("week")) {
                        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 whitespace-normal leading-snug">{t("adm_leads_tl_week", "📅 Within a Week")}</Badge>;
                      }
                      if (tl === "month" || tl.includes("month")) {
                        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold px-1.5 py-0.5 whitespace-normal leading-snug">{t("adm_leads_tl_month", "🗓️ This Month")}</Badge>;
                      }
                      if (tl === "research" || tl.includes("plan")) {
                        return <Badge variant="outline" className="text-zinc-600 border-zinc-300 text-[9px] px-1.5 py-0.5 whitespace-normal leading-snug">{t("adm_leads_tl_plan", "🔍 Planning")}</Badge>;
                      }
                      return null;
                    })()}
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openWhatsApp(lead); }}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1.5 rounded-md transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="w-3 h-3 shrink-0" /> WhatsApp
                    </button>
                    
                    <Link 
                      href={`/quote/${lead.id}`} 
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white px-2 py-1.5 rounded-md transition-colors whitespace-nowrap"
                    >
                      <Eye className="w-3 h-3 shrink-0" /> {t("adm_leads_btn_quote", "Quote")}
                    </Link>
                  </div>
                </div>
              ))}
              
              {columnLeads.length === 0 && (
                <div className="h-full flex items-center justify-center text-muted-foreground/50 text-xs font-medium border-2 border-dashed border-border/50 rounded-lg p-4 text-center">
                  {t("adm_lc_drag_here", "Drag leads here")}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
