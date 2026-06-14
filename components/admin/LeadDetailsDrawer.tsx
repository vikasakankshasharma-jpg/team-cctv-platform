"use client";

import { useState, useEffect } from "react";
import { X, Phone, Mail, FileText, Calendar, Loader2, ArrowRight, MapPin, Building, Activity, Send } from "lucide-react";
import type { Lead, LeadActivity } from "@/types";
import { getLeadActivities, addLeadActivity, updateNextFollowUp } from "@/app/actions/leads";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface LeadDetailsDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; name: string; role: string };
  onStatusChange: (leadId: string, status: string) => Promise<void>;
}

export function LeadDetailsDrawer({ lead, isOpen, onClose, currentUser, onStatusChange }: LeadDetailsDrawerProps) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [followUpDate, setFollowUpDate] = useState(lead?.next_followup_date || "");

  const loadActivities = async () => {
    if (!lead?.id) return;
    setLoading(true);
    const data = await getLeadActivities(lead.id);
    setActivities(data as LeadActivity[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && lead?.id) {
      setFollowUpDate(lead.next_followup_date || "");
      loadActivities();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lead?.id]);

  const handleAddActivity = async (type: "note" | "call" | "call_attempted" | "site_visit") => {
    if (!lead?.id) return;
    if (type === "note" && !noteContent.trim()) {
      toast.error("Please enter a note.");
      return;
    }
    
    const content = type === "note" ? noteContent : 
                    type === "call" ? "Call Connected successfully" :
                    type === "call_attempted" ? "Call Attempted (No Answer/Busy)" :
                    `Logged a ${type}`;
    
    const res = await addLeadActivity(lead.id, {
      type,
      content,
      created_by_id: currentUser.id,
      created_by_name: currentUser.name,
    });
    
    if (res.success) {
      toast.success("Activity logged");
      if (res.newStatus) {
        toast.success(`Lead automatically advanced to ${res.newStatus.replace('_', ' ').toUpperCase()}`);
      }
      setNoteContent("");
      loadActivities();
    } else {
      toast.error("Failed to log activity");
    }
  };

  const handleSetFollowUp = async () => {
    if (!lead?.id) return;
    const res = await updateNextFollowUp(lead.id, followUpDate || null);
    if (res.success) {
      toast.success("Follow-up date updated");
      loadActivities();
    } else {
      toast.error("Failed to update follow-up");
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] lg:w-[800px] bg-background border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{lead.customer_name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Phone className="w-4 h-4" /> {lead.mobile_number}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {lead.status.replace("_", " ")}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Panel: Details */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-border custom-scrollbar">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Lead Details</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 p-4 rounded-xl bg-secondary/50 border border-border">
                  <span className="block text-xs font-medium text-muted-foreground mb-1"><Building className="inline w-3 h-3 mr-1"/> Property</span>
                  <span className="font-semibold text-sm capitalize">{lead.property_type}</span>
                </div>
                <div className="flex-1 p-4 rounded-xl bg-secondary/50 border border-border">
                  <span className="block text-xs font-medium text-muted-foreground mb-1"><Activity className="inline w-3 h-3 mr-1"/> Technology</span>
                  <span className="font-semibold text-sm uppercase">{lead.technology_choice}</span>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <span className="block text-xs font-medium text-primary mb-2">Quote Management</span>
                <div className="flex gap-2">
                  <a href={`/admin/leads/${lead.id}/quote-builder`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Create Custom Quote
                  </a>
                </div>
              </div>

              {lead.address && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <span className="block text-xs font-medium text-muted-foreground mb-2"><MapPin className="inline w-3 h-3 mr-1"/> Location</span>
                  <p className="text-sm font-medium">{lead.address.pincode}</p>
                  <p className="text-sm text-muted-foreground mt-1">{lead.address.landmark1}</p>
                </div>
              )}

              {lead.wizard_answers && Object.keys(lead.wizard_answers).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Wizard Answers</h4>
                  <div className="space-y-2">
                    {Object.entries(lead.wizard_answers).map(([key, val]: [string, any]) => (
                      <div key={key} className="flex justify-between p-3 rounded-lg bg-card border border-border text-sm">
                        <span className="text-muted-foreground font-medium">{key.replace("q_", "").replace(/_/g, " ")}</span>
                        <div className="font-semibold text-right max-w-[50%]">
                          {Array.isArray(val) ? (
                            val.length > 0 && typeof val[0] === 'object' ? (
                              <div className="flex flex-col gap-1 text-xs">
                                {val.map((item, i) => (
                                  <div key={i} className="bg-secondary/50 p-1.5 rounded-md">
                                    {Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              val.join(', ')
                            )
                          ) : typeof val === 'object' && val !== null ? (
                            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>
                          ) : (
                            String(val)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: CRM Timeline */}
          <div className="w-full md:w-1/2 flex flex-col h-full bg-muted/10">
            {/* Follow-up Scheduler */}
            <div className="p-4 border-b border-border bg-card">
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Next Follow-Up</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="flex-1 h-10 px-3 bg-background border border-border rounded-md text-sm outline-none focus:ring-1 focus:ring-primary"
                />
                <Button onClick={handleSetFollowUp} disabled={followUpDate === lead.next_followup_date}>
                  Set
                </Button>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : activities.length === 0 ? (
                <div className="text-center p-8 text-sm text-muted-foreground">No activities recorded yet.</div>
              ) : (
                activities.map(act => (
                  <div key={act.id} className="relative pl-6 pb-2 border-l-2 border-border last:border-transparent last:pb-0">
                    <div className={`absolute -left-2 top-0 w-4 h-4 rounded-full border-4 border-background 
                      ${act.type === 'note' ? 'bg-blue-500' : act.type === 'call' ? 'bg-green-500' : act.type === 'call_attempted' ? 'bg-orange-500' : act.type === 'system' ? 'bg-zinc-500' : 'bg-primary'}
                    `} />
                    <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold capitalize text-muted-foreground">{act.type.replace('_', ' ')}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(act.created_at as string).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium">{act.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-2 font-medium">by {act.created_by_name}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Box */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2 mb-2">
                <Button size="sm" variant="outline" onClick={() => handleAddActivity("call")} className="text-xs font-semibold h-8 border-green-500/30 text-green-600 bg-green-500/5 hover:bg-green-500/10 px-2">
                  <Phone className="w-3 h-3 mr-1.5" /> Call Connected
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAddActivity("call_attempted")} className="text-xs font-semibold h-8 border-orange-500/30 text-orange-600 bg-orange-500/5 hover:bg-orange-500/10 px-2">
                  <Phone className="w-3 h-3 mr-1.5 opacity-60" /> Call Attempted
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAddActivity("site_visit")} className="text-xs font-semibold h-8 border-purple-500/30 text-purple-600 bg-purple-500/5 hover:bg-purple-500/10 px-2">
                  <MapPin className="w-3 h-3 mr-1.5" /> Site Visit
                </Button>
              </div>
              <div className="relative">
                <textarea 
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Type a note..."
                  className="w-full h-24 p-3 pr-12 bg-background border border-border rounded-lg text-sm resize-none outline-none focus:ring-1 focus:ring-primary shadow-inner"
                />
                <button 
                  onClick={() => handleAddActivity("note")}
                  className="absolute bottom-3 right-3 p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
