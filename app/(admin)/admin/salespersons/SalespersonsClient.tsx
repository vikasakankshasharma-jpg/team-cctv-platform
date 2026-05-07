"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  MapPin, 
  Plus, 
  Trash2, 
  Save, 
  ShieldCheck, 
  UserPlus, 
  Globe, 
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { toast } from "sonner";
import type { Salesperson, CoverageZone } from "@/types";

export default function SalespersonsClient() {
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [zones, setZones] = useState<CoverageZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [showAddSalesperson, setShowAddSalesperson] = useState(false);
  const [newSalesperson, setNewSalesperson] = useState<Partial<Salesperson>>({
    is_active: true,
    assigned_zone_ids: []
  });

  const [showAddZone, setShowAddZone] = useState(false);
  const [newZone, setNewZone] = useState<Partial<CoverageZone>>({
    pincodes: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [sRes, zRes] = await Promise.all([
        fetch("/api/admin/salespersons"),
        fetch("/api/admin/coverage-zones")
      ]);
      setSalespersons(await sRes.json());
      setZones(await zRes.json());
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSalesperson() {
    if (!newSalesperson.name || !newSalesperson.mobile_number) {
      toast.error("Name and Mobile are required");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/salespersons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSalesperson)
      });
      if (res.ok) {
        toast.success("Salesperson added");
        setShowAddSalesperson(false);
        setNewSalesperson({ is_active: true, assigned_zone_ids: [] });
        fetchData();
      }
    } catch (err) {
      toast.error("Error adding salesperson");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddZone() {
    if (!newZone.name || (newZone.pincodes?.length === 0)) {
      toast.error("Name and at least one pincode are required");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/coverage-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newZone)
      });
      if (res.ok) {
        toast.success("Zone added");
        setShowAddZone(false);
        setNewZone({ pincodes: [] });
        fetchData();
      }
    } catch (err) {
      toast.error("Error adding zone");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSalesperson(id: string) {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/admin/salespersons/${id}`, { method: "DELETE" });
      setSalespersons(prev => prev.filter(s => s.id !== id));
      toast.success("Salesperson removed");
    } catch (err) {
      toast.error("Delete failed");
    }
  }

  async function handleDeleteZone(id: string) {
    if (!confirm("Delete zone? This won't remove salespersons but will unassign this zone.")) return;
    try {
      await fetch(`/api/admin/coverage-zones/${id}`, { method: "DELETE" });
      setZones(prev => prev.filter(z => z.id !== id));
      toast.success("Zone removed");
    } catch (err) {
      toast.error("Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      <PageHeader 
        icon={Users} 
        title="Salesforce Orchestrator" 
        description="Manage geographic lead assignments and sales staff credentials."
        badge={`${salespersons.length} Agents Active`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Salespersons List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">Active Agents</h3>
            <button 
              onClick={() => setShowAddSalesperson(true)}
              className="flex items-center gap-2 bg-zinc-900 dark:bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
            >
              <UserPlus className="w-4 h-4" /> Add Agent
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salespersons.map(s => (
              <div key={s.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-[24px] shadow-sm hover:shadow-xl transition-all group relative">
                <button 
                  onClick={() => handleDeleteSalesperson(s.id!)}
                  className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-lg">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">{s.name}</h4>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{s.mobile_number}</p>
                  </div>
                </div>

                <div className="space-y-3">
                   <div className="flex flex-wrap gap-1.5">
                     {s.assigned_zone_ids && s.assigned_zone_ids.length > 0 ? (
                       s.assigned_zone_ids.map(zid => {
                         const zone = zones.find(z => z.id === zid);
                         return (
                           <span key={zid} className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 text-[8px] font-black uppercase text-zinc-500 rounded-md border border-zinc-100 dark:border-zinc-700">
                             {zone?.name || zid}
                           </span>
                         );
                       })
                     ) : (
                       <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                         <AlertCircle className="w-3 h-3" /> No Zones Assigned
                       </span>
                     )}
                   </div>
                   
                   <div className="flex items-center justify-between pt-2 border-t border-zinc-50 dark:border-zinc-800">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {s.is_active ? 'Online' : 'Offline'}
                      </span>
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter italic">
                         Added {s.created_at ? new Date(s.created_at as any).toLocaleDateString() : 'Recently'}
                      </span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zones Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">Coverage Zones</h3>
            <button 
              onClick={() => setShowAddZone(true)}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {zones.map(z => (
              <div key={z.id} className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between group">
                <div>
                  <h5 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">{z.name}</h5>
                  <p className="text-[9px] text-zinc-400 font-medium truncate max-w-[180px]">
                    {z.pincodes.join(", ")}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteZone(z.id!)}
                  className="p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddSalesperson && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" onClick={() => setShowAddSalesperson(false)} />
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[32px] p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter mb-6 uppercase">Deploy New Agent</h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Full Name</label>
                <input 
                  type="text" 
                  value={newSalesperson.name || ""} 
                  onChange={e => setNewSalesperson(prev => ({...prev, name: e.target.value}))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Mobile (WhatsApp for OTP)</label>
                <input 
                  type="tel" 
                  value={newSalesperson.mobile_number || ""} 
                  onChange={e => setNewSalesperson(prev => ({...prev, mobile_number: e.target.value}))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="10-digit mobile"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Zone Assignments</label>
                <div className="flex flex-wrap gap-2">
                  {zones.map(z => {
                    const isSelected = newSalesperson.assigned_zone_ids?.includes(z.id!);
                    return (
                      <button 
                        key={z.id}
                        onClick={() => {
                          const current = newSalesperson.assigned_zone_ids || [];
                          if (isSelected) {
                            setNewSalesperson(prev => ({...prev, assigned_zone_ids: current.filter(id => id !== z.id)}));
                          } else {
                            setNewSalesperson(prev => ({...prev, assigned_zone_ids: [...current, z.id!]}));
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-400'}`}
                      >
                        {z.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={handleAddSalesperson}
                  disabled={isSaving}
                  className="flex-1 bg-zinc-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Deploy Agent
                </button>
                <button 
                  onClick={() => setShowAddSalesperson(false)}
                  className="px-6 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-black uppercase text-[10px] rounded-2xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddZone && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" onClick={() => setShowAddZone(false)} />
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[32px] p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter mb-6 uppercase">Define Coverage Zone</h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Zone Name</label>
                <input 
                  type="text" 
                  value={newZone.name || ""} 
                  onChange={e => setNewZone(prev => ({...prev, name: e.target.value}))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. South Delhi"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Pincodes (Comma Separated)</label>
                <textarea 
                  rows={4}
                  value={newZone.pincodes?.join(", ") || ""} 
                  onChange={e => setNewZone(prev => ({...prev, pincodes: e.target.value.split(",").map(p => p.trim()).filter(p => p !== "")}))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="110001, 110002, 110003..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={handleAddZone}
                  disabled={isSaving}
                  className="flex-1 bg-zinc-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} Establish Zone
                </button>
                <button 
                  onClick={() => setShowAddZone(false)}
                  className="px-6 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-black uppercase text-[10px] rounded-2xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
