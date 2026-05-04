"use client";

import { useState } from "react";
import { FollowUpCampaign } from "@/types";
import { Plus, Edit2, Trash2, Power, MessageCircle, Clock, Percent } from "lucide-react";
import { updateCampaign, deleteCampaign, createCampaign } from "@/app/actions/campaigns";

interface CampaignsClientProps {
  initialCampaigns: FollowUpCampaign[];
}

export default function CampaignsClient({ initialCampaigns }: CampaignsClientProps) {
  const [campaigns, setCampaigns] = useState<FollowUpCampaign[]>(initialCampaigns);
  const [isEditing, setIsEditing] = useState<FollowUpCampaign | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await deleteCampaign(id);
      setCampaigns(campaigns.filter(c => c.id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete campaign");
    }
  };

  const handleToggle = async (campaign: FollowUpCampaign) => {
    try {
      await updateCampaign(campaign.id!, { is_active: !campaign.is_active });
      setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, is_active: !c.is_active } : c));
    } catch (e) {
      console.error(e);
      alert("Failed to toggle campaign");
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
      setIsEditing(null);
      setIsCreating(false);
    } catch (error) {
      console.error(error);
      alert("Failed to save campaign.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black uppercase tracking-widest text-zinc-900 dark:text-white">Active Campaigns</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map(campaign => (
          <div key={campaign.id} className={`bg-white dark:bg-zinc-900 border ${campaign.is_active ? 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-zinc-200 dark:border-zinc-800 opacity-70'} rounded-[24px] p-6 transition-all`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest text-zinc-900 dark:text-white">{campaign.name}</h3>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 block">Trigger: {campaign.trigger_status}</span>
              </div>
              <button 
                onClick={() => handleToggle(campaign)}
                className={`p-2 rounded-full ${campaign.is_active ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-zinc-400" /> Wait {campaign.delay_hours} hours
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                <Percent className="w-3.5 h-3.5" /> 
                {campaign.offer_type === 'discount_percent' ? `${campaign.offer_value}% Discount` : campaign.offer_type === 'free_amc' ? 'Free AMC' : 'No Offer'}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500">
                <MessageCircle className="w-3.5 h-3.5" /> Via {campaign.action_channel}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={() => setIsEditing(campaign)} className="flex-1 flex justify-center items-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg transition-colors">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => handleDelete(campaign.id!)} className="flex-1 flex justify-center items-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[24px]">
            No campaigns found. Create one to get started.
          </div>
        )}
      </div>

      {(isEditing || isCreating) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[32px] p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black uppercase tracking-widest mb-6 text-zinc-900 dark:text-white">
              {isCreating ? "Create Follow-Up Campaign" : "Edit Campaign"}
            </h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Campaign Name</label>
                  <input name="name" defaultValue={isEditing?.name || ""} required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Trigger Status</label>
                  <select name="trigger_status" defaultValue={isEditing?.trigger_status || "quoted"} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-bold">
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="site_visit">Site Visit</option>
                    <option value="quoted">Quoted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Delay (Hours)</label>
                  <input type="number" name="delay_hours" defaultValue={isEditing?.delay_hours || 48} required min="1" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Action Channel</label>
                  <select name="action_channel" defaultValue={isEditing?.action_channel || "whatsapp"} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-bold">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Offer Type</label>
                  <select name="offer_type" defaultValue={isEditing?.offer_type || "discount_percent"} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-bold">
                    <option value="discount_percent">Discount (%)</option>
                    <option value="free_amc">Free 1-Yr AMC</option>
                    <option value="none">No Offer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Offer Value (if discount)</label>
                  <input type="number" step="0.1" name="offer_value" defaultValue={isEditing?.offer_value || 5} min="0" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Message Template</label>
                <textarea 
                  name="message_template" 
                  defaultValue={isEditing?.message_template || "Hi {{name}}, we noticed you haven't finalized your CCTV setup yet. Click here to claim your special {{offer}}! {{quote_link}}"} 
                  required 
                  rows={4}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                />
                <p className="text-[10px] text-zinc-500 mt-2 font-medium">Variables: {"{{name}}, {{offer}}, {{quote_link}}"}</p>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" name="is_active" id="is_active" defaultChecked={isEditing ? isEditing.is_active : true} className="w-4 h-4 rounded border-zinc-300" />
                <label htmlFor="is_active" className="text-sm font-bold">Campaign is Active</label>
              </div>

              <div className="flex gap-4 pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
                <button type="button" onClick={() => { setIsEditing(null); setIsCreating(false); }} className="flex-1 py-4 text-xs font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 text-xs font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-50">
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
