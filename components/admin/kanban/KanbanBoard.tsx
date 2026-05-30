"use client";

import React, { useState } from "react";
import { Lead } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, MessageCircle, MapPin, Eye, Zap } from "lucide-react";
import Link from "next/link";
import { updateLeadStatus } from "@/app/actions/leads";

interface KanbanBoardProps {
  leads: Lead[];
  onStatusChange: (leadId: string, newStatus: string) => Promise<void>;
  isAdmin?: boolean;
  onLeadClick?: (lead: Lead) => void;
}

const COLUMNS = [
  { id: "new", title: "Incoming", color: "bg-blue-500/10 border-blue-200 text-blue-700" },
  { id: "contacted", title: "Contacted", color: "bg-amber-500/10 border-amber-200 text-amber-700" },
  { id: "site_visit", title: "Site Visit", color: "bg-purple-500/10 border-purple-200 text-purple-700" },
  { id: "quoted", title: "Quoted", color: "bg-zinc-500/10 border-zinc-200 text-zinc-700" },
  { id: "won", title: "Won", color: "bg-emerald-500/10 border-emerald-200 text-emerald-700" },
];

export function KanbanBoard({ leads, onStatusChange, isAdmin, onLeadClick }: KanbanBoardProps) {
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
            <div className={`px-4 py-3 border-b border-border/50 flex items-center justify-between rounded-t-xl ${col.color.split(' ')[0]}`}>
              <h3 className={`font-bold text-sm tracking-tight ${col.color.split(' ')[2]}`}>
                {col.title}
              </h3>
              <Badge variant="secondary" className="bg-white/50 text-xs shadow-sm">
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
                    <Phone className="w-3 h-3" /> 
                    {lead.mobile_number}
                  </div>

                  {lead.address && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-3 truncate">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-primary/60" />
                      <span className="truncate">{lead.address.pincode} - {lead.address.landmark1 || 'No Landmark'}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="capitalize text-[9px] font-semibold tracking-wider">
                      {lead.property_type}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold text-primary border-primary/30">
                      {lead.technology_choice}
                    </Badge>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openWhatsApp(lead); }}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1.5 rounded-md transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </button>
                    
                    <Link 
                      href={`/quote/${lead.id}`} 
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white px-2 py-1.5 rounded-md transition-colors"
                    >
                      <Eye className="w-3 h-3" /> Quote
                    </Link>
                  </div>
                </div>
              ))}
              
              {columnLeads.length === 0 && (
                <div className="h-full flex items-center justify-center text-muted-foreground/50 text-xs font-medium border-2 border-dashed border-border/50 rounded-lg p-4 text-center">
                  Drag leads here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
