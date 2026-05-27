"use client";

import { useState } from "react";
import { FollowUpCampaign } from "@/types";
import { Plus, Edit2, Trash2, Power, MessageCircle, Clock, Percent, Zap } from "lucide-react";
import { updateCampaign, deleteCampaign, createCampaign } from "@/app/actions/campaigns";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface CampaignsClientProps {
  initialCampaigns: FollowUpCampaign[];
}

export default function CampaignsClient({ initialCampaigns }: CampaignsClientProps) {
  const [campaigns, setCampaigns] = useState<FollowUpCampaign[]>(initialCampaigns);
  const [isEditing, setIsEditing] = useState<FollowUpCampaign | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this campaign? This cannot be undone.")) return;
    try {
      await deleteCampaign(id);
      setCampaigns(campaigns.filter(c => c.id !== id));
      toast.success("Campaign deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete campaign");
    }
  };

  const handleToggle = async (campaign: FollowUpCampaign) => {
    try {
      await updateCampaign(campaign.id!, { is_active: !campaign.is_active });
      setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, is_active: !c.is_active } : c));
      toast.success(campaign.is_active ? "Campaign paused" : "Campaign activated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update campaign");
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data: Partial<FollowUpCampaign> = {
      name: formData.get("name") as string,
      trigger_status: formData.get("trigger_status") as any,
      delay_hours: parseInt(formData.get("delay_hours") as string, 10),
      action_channel: formData.get("action_channel") as any,
      message_template: formData.get("message_template") as string,
      offer_type: formData.get("offer_type") as any,
      offer_value: parseFloat(formData.get("offer_value") as string || "0"),
      is_active: formData.get("is_active") === "on"
    };

    try {
      if (isEditing) {
        await updateCampaign(isEditing.id!, data);
        setCampaigns(campaigns.map(c => c.id === isEditing.id ? { ...c, ...data } : c));
      } else {
        const newCampaign = await createCampaign(data as Omit<FollowUpCampaign, "id" | "created_at">);
        setCampaigns([newCampaign, ...campaigns]);
      }
      toast.success(isEditing ? "Campaign updated" : "Campaign created");
      setIsEditing(null);
      setIsCreating(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Follow-Up Campaigns</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Automated outreach triggered by lead status changes.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-sm active:scale-95 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {campaigns.map(campaign => (
          <Card key={campaign.id} className={`p-5 transition-all shadow-sm ${
            campaign.is_active
              ? 'border-border bg-card hover:shadow-md'
              : 'border-border bg-muted/30 opacity-70 hover:opacity-100'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-sm text-foreground tracking-tight">{campaign.name}</h3>
                <span className="text-[10px] font-medium text-muted-foreground mt-1 block">Triggers on: <span className="font-semibold text-foreground uppercase tracking-wider">{campaign.trigger_status}</span></span>
              </div>
              <button 
                onClick={() => handleToggle(campaign)}
                className={`p-2 rounded-full transition-colors ${campaign.is_active ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
                title={campaign.is_active ? "Pause Campaign" : "Activate Campaign"}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2.5 mb-5">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Wait {campaign.delay_hours} hours
              </div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-success">
                <Percent className="w-3.5 h-3.5" /> 
                {campaign.offer_type === 'discount_percent' ? `${campaign.offer_value}% Discount` : campaign.offer_type === 'free_amc' ? 'Free AMC' : 'No Offer'}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-primary">
                <MessageCircle className="w-3.5 h-3.5" /> Via {campaign.action_channel}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <button onClick={() => setIsEditing(campaign)} className="flex-1 flex justify-center items-center gap-2 py-1.5 text-[10px] font-semibold uppercase bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => handleDelete(campaign.id!)} className="flex-1 flex justify-center items-center gap-2 py-1.5 text-[10px] font-semibold uppercase bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-md transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </Card>
        ))}
        {campaigns.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground font-medium text-xs border border-dashed border-border rounded-xl">
            No campaigns found. Create one to get started.
          </div>
        )}
      </div>

      {(isEditing || isCreating) && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold tracking-tight mb-6 text-foreground">
              {isCreating ? "Create Follow-Up Campaign" : "Edit Campaign"}
            </h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Campaign Name</label>
                  <Input name="name" defaultValue={isEditing?.name || ""} required className="w-full" placeholder="e.g. Abandoned Cart - 48h" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Trigger Status</label>
                  <select name="trigger_status" defaultValue={isEditing?.trigger_status || "quoted"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none">
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="site_visit">Site Visit</option>
                    <option value="quoted">Quoted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Delay (Hours)</label>
                  <Input type="number" name="delay_hours" defaultValue={isEditing?.delay_hours || 48} required min="1" className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Action Channel</label>
                  <select name="action_channel" defaultValue={isEditing?.action_channel || "whatsapp"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Offer Type</label>
                  <select name="offer_type" defaultValue={isEditing?.offer_type || "discount_percent"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none">
                    <option value="discount_percent">Discount (%)</option>
                    <option value="free_amc">Free 1-Yr AMC</option>
                    <option value="none">No Offer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Offer Value (if discount)</label>
                  <Input type="number" step="0.1" name="offer_value" defaultValue={isEditing?.offer_value || 5} min="0" className="w-full" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Message Template</label>
                <textarea 
                  name="message_template" 
                  defaultValue={isEditing?.message_template || "Hi {{name}}, we noticed you haven't finalized your CCTV setup yet. Click here to claim your special {{offer}}! {{quote_link}}"} 
                  required 
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">Variables: {"{{name}}, {{offer}}, {{quote_link}}"}</p>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" name="is_active" id="is_active" defaultChecked={isEditing ? isEditing.is_active : true} className="w-4 h-4 rounded border-input accent-primary" />
                <label htmlFor="is_active" className="text-sm font-semibold text-foreground">Campaign is Active</label>
              </div>

              <div className="flex gap-4 pt-6 mt-6 border-t border-border">
                <button type="button" onClick={() => { setIsEditing(null); setIsCreating(false); }} className="flex-1 py-2.5 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm">
                  {isSubmitting ? "Saving..." : "Save Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
