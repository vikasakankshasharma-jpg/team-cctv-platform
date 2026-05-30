"use client";

import { useState, useEffect } from "react";
import { Phone, X, SkipForward, ArrowRight, Save, Clock, Target, CalendarDays, Loader2 } from "lucide-react";
import type { Lead } from "@/types";
import { addLeadActivity, updateNextFollowUp, updateLeadStatus } from "@/app/actions/leads";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ProgressiveDialerProps {
  leads: Lead[];
  currentUser: { id: string; name: string; role: string };
  isOpen: boolean;
  onClose: () => void;
}

export function ProgressiveDialer({ leads, currentUser, isOpen, onClose }: ProgressiveDialerProps) {
  const [queue, setQueue] = useState<Lead[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [callNotes, setCallNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [statusChange, setStatusChange] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Build Queue: 
      // 1. Follow-ups for today or earlier
      // 2. Leads in "new" status
      const todayStr = new Date().toISOString().split("T")[0];
      
      const followUps = leads.filter(l => l.next_followup_date && l.next_followup_date <= todayStr);
      const newLeads = leads.filter(l => l.status === "new" && (!l.next_followup_date || l.next_followup_date > todayStr));
      
      const initialQueue = [...followUps, ...newLeads];
      setQueue(initialQueue);
      setCurrentIndex(0);
      resetForm();
    }
  }, [isOpen, leads]);

  const resetForm = () => {
    setCallNotes("");
    setFollowUpDate("");
    setStatusChange("");
  };

  const currentLead = queue[currentIndex];

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetForm();
    } else {
      toast.success("Queue completed! Great job.");
      onClose();
    }
  };

  const handleLogAndNext = async () => {
    if (!currentLead?.id) return;
    setIsSubmitting(true);
    
    try {
      if (callNotes.trim()) {
        await addLeadActivity(currentLead.id, {
          type: "call",
          content: callNotes,
          created_by_id: currentUser.id,
          created_by_name: currentUser.name,
        });
      }

      if (followUpDate && followUpDate !== currentLead.next_followup_date) {
        await updateNextFollowUp(currentLead.id, followUpDate);
      }

      if (statusChange && statusChange !== currentLead.status) {
        await updateLeadStatus(currentLead.id, statusChange);
      }

      toast.success("Logged successfully");
      handleNext();
    } catch (error) {
      console.error(error);
      toast.error("Failed to log activity");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (queue.length === 0) {
    return (
      <div className="fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6">
          <Target className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-2">Queue Empty!</h2>
        <p className="text-muted-foreground mb-8 text-center px-4 max-w-sm">
          No urgent follow-ups or unattended leads for today. You are completely caught up.
        </p>
        <Button onClick={onClose} size="lg" className="rounded-full px-8 font-bold">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const isFollowUp = currentLead.next_followup_date && currentLead.next_followup_date <= new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300 overflow-hidden">
      
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-sm">
            {currentIndex + 1}
          </div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">of {queue.length} Leads</span>
        </div>
        <button onClick={onClose} className="p-2 bg-secondary rounded-full hover:bg-muted transition-colors">
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Main Content Area (Scrollable if needed) */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-xl mx-auto p-6 md:p-12 space-y-8">
          
          {/* Lead Header */}
          <div className="text-center space-y-3">
            {isFollowUp ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-black uppercase tracking-widest border border-amber-500/20">
                <Clock className="w-3 h-3" /> Scheduled Follow-Up
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-widest border border-blue-500/20">
                <Target className="w-3 h-3" /> Unattended Lead
              </span>
            )}
            <h1 className="text-4xl font-black text-foreground tracking-tight">{currentLead.customer_name}</h1>
            <p className="text-lg text-muted-foreground font-medium flex items-center justify-center gap-2">
              <span className="capitalize">{currentLead.property_type}</span>
              <span>•</span>
              <span className="uppercase">{currentLead.technology_choice}</span>
            </p>
          </div>

          {/* Huge Call Button */}
          <div className="flex justify-center pt-4">
            <a 
              href={`tel:${currentLead.mobile_number}`}
              className="group relative flex items-center justify-center w-full max-w-xs h-20 rounded-[32px] bg-gradient-to-br from-green-400 to-green-600 shadow-xl shadow-green-500/20 active:scale-95 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4 text-white">
                <Phone className="w-8 h-8 fill-current" />
                <span className="text-2xl font-black tracking-wide">Call Now</span>
              </div>
            </a>
          </div>

          <div className="text-center text-sm font-bold text-muted-foreground">
            {currentLead.mobile_number}
          </div>

          {/* Quick Action Form */}
          <div className="bg-card border border-border rounded-[24px] p-6 shadow-sm space-y-6 mt-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Log Outcome</h3>
            
            <textarea 
              placeholder="What happened on the call?"
              value={callNotes}
              onChange={e => setCallNotes(e.target.value)}
              className="w-full h-32 p-4 bg-background border border-border rounded-xl resize-none outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5"/> Next Follow-up</label>
                <input 
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full h-12 px-4 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Update Status</label>
                <select 
                  value={statusChange || currentLead.status}
                  onChange={e => setStatusChange(e.target.value)}
                  className="w-full h-12 px-4 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 font-medium capitalize"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="site_visit">Site Visit</option>
                  <option value="quoted">Quoted</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-background/80 backdrop-blur-xl border-t border-border flex gap-4">
        <Button 
          variant="outline" 
          size="lg" 
          className="flex-1 h-14 rounded-2xl font-bold text-muted-foreground border-border hover:bg-secondary"
          onClick={handleNext}
        >
          <SkipForward className="w-5 h-5 mr-2" /> Skip
        </Button>
        <Button 
          size="lg" 
          className="flex-[2] h-14 rounded-2xl font-black bg-primary text-primary-foreground hover:bg-primary/90 text-lg shadow-lg shadow-primary/20"
          onClick={handleLogAndNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <>
              Log & Next <ArrowRight className="w-6 h-6 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
