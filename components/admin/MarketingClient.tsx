"use client";

import { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Trash2, Power, PowerOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function MarketingClient() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    badge: "Seasonal",
    textColor: "#ffffff",
    accentColor: "#fbbf24",
    title: "",
    subtitle: "",
    offerText: "",
    imageBase64: "",
  });

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/marketing");
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, imageBase64: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.imageBase64) {
      toast.error("Name and Image are required.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Template created successfully");
      setIsModalOpen(false);
      setFormData({
        name: "", badge: "Seasonal", textColor: "#ffffff", accentColor: "#fbbf24", 
        title: "", subtitle: "", offerText: "", imageBase64: ""
      });
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || "Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      });
      if (res.ok) fetchTemplates();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/admin/marketing?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted successfully");
        fetchTemplates();
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Marketing Hub</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage EDM Poster templates for partners.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(tpl => (
            <div key={tpl.id} className={`bg-white rounded-2xl border ${tpl.is_active ? 'border-slate-200' : 'border-red-200 opacity-70'} overflow-hidden shadow-sm`}>
              <div className="aspect-[4/5] w-full bg-slate-100 relative">
                {tpl.imageUrl ? (
                  <img src={tpl.imageUrl} alt={tpl.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon className="w-12 h-12" /></div>
                )}
                {!tpl.is_active && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-red-200">Inactive</span>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{tpl.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-widest font-semibold">{tpl.badge}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-4 line-clamp-1">{tpl.title}</p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(tpl.id, tpl.is_active)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                      tpl.is_active 
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {tpl.is_active ? <><PowerOff className="w-3.5 h-3.5" /> Deactivate</> : <><Power className="w-3.5 h-3.5" /> Activate</>}
                  </button>
                  <button
                    onClick={() => deleteTemplate(tpl.id)}
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">Create New Template</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Template Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Diwali Mega Sale" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Badge/Category</label>
                  <select required value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Seasonal">Seasonal (Festivals)</option>
                    <option value="Standard">Standard (General)</option>
                    <option value="B2B">B2B (Business)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Background Image</label>
                <input required type="file" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                <p className="text-[10px] text-slate-400 mt-1">Recommended size: 1080x1350 px (Vertical). Max 2MB.</p>
              </div>

              {formData.imageBase64 && (
                <div className="w-32 aspect-[4/5] rounded-xl overflow-hidden border border-slate-200">
                  <img src={formData.imageBase64} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Text Overlays</h3>
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Main Title</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" placeholder="e.g. UPGRADE YOUR HOME SECURITY" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Subtitle</label>
                  <input required type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" placeholder="e.g. Get professional CCTV installation." />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Offer Highlight Text</label>
                  <input required type="text" value={formData.offerText} onChange={e => setFormData({...formData, offerText: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" placeholder="e.g. FLAT ₹500 OFF" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Text Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={formData.textColor} onChange={e => setFormData({...formData, textColor: e.target.value})} className="w-10 h-10 rounded cursor-pointer" />
                    <input type="text" value={formData.textColor} onChange={e => setFormData({...formData, textColor: e.target.value})} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm uppercase" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Accent Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={formData.accentColor} onChange={e => setFormData({...formData, accentColor: e.target.value})} className="w-10 h-10 rounded cursor-pointer" />
                    <input type="text" value={formData.accentColor} onChange={e => setFormData({...formData, accentColor: e.target.value})} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm uppercase" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 sticky bottom-0 bg-white pb-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-bold shadow flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
