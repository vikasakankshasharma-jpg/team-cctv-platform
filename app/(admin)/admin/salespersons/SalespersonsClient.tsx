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

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-500">
      <PageHeader 
        icon={Users} 
        title="Salesforce Orchestrator" 
        description="Manage geographic lead assignments and sales staff credentials."
        badge={`${salespersons.length} Agents Active`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Salespersons List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">Active Agents</h3>
            <button 
              onClick={() => setShowAddSalesperson(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm active:scale-95"
            >
              <UserPlus className="w-4 h-4" /> Add Agent
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salespersons.map(s => (
              <Card key={s.id} className="p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group relative border-border bg-card">
                <button 
                  onClick={() => handleDeleteSalesperson(s.id!)}
                  className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground tracking-tight">{s.name}</h4>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{s.mobile_number}</p>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex flex-wrap gap-1.5">
                     {s.assigned_zone_ids && s.assigned_zone_ids.length > 0 ? (
                       s.assigned_zone_ids.map(zid => {
                         const zone = zones.find(z => z.id === zid);
                         return (
                           <Badge key={zid} variant="secondary" className="text-[10px] uppercase font-semibold">
                             {zone?.name || zid}
                           </Badge>
                         );
                       })
                     ) : (
                       <span className="text-[10px] font-semibold text-warning uppercase flex items-center gap-1">
                         <AlertCircle className="w-3 h-3" /> No Zones Assigned
                       </span>
                     )}
                   </div>
                   
                   <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${s.is_active ? 'bg-success/10 text-success border border-success/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                        {s.is_active ? 'Online' : 'Offline'}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground italic">
                         Added {s.created_at ? new Date(s.created_at as any).toLocaleDateString() : 'Recently'}
                      </span>
                   </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Zones Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">Coverage Zones</h3>
            <button 
              onClick={() => setShowAddZone(true)}
              className="p-2 bg-secondary text-secondary-foreground rounded-full hover:bg-primary/10 hover:text-primary transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {zones.map(z => (
              <Card key={z.id} className="p-4 rounded-xl flex items-center justify-between group border-border shadow-sm bg-card">
                <div>
                  <h5 className="text-sm font-semibold text-foreground tracking-tight">{z.name}</h5>
                  <p className="text-xs text-muted-foreground font-medium mt-1 truncate max-w-[180px]" title={z.pincodes.join(", ")}>
                    {z.pincodes.join(", ")}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteZone(z.id!)}
                  className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddSalesperson && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddSalesperson(false)} />
          <div className="relative bg-card w-full max-w-lg rounded-2xl p-6 shadow-lg border border-border animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold text-foreground tracking-tight mb-6">Deploy New Agent</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name</label>
                <Input 
                  type="text" 
                  value={newSalesperson.name || ""} 
                  onChange={e => setNewSalesperson(prev => ({...prev, name: e.target.value}))}
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Mobile (WhatsApp for OTP)</label>
                <Input 
                  type="tel" 
                  value={newSalesperson.mobile_number || ""} 
                  onChange={e => setNewSalesperson(prev => ({...prev, mobile_number: e.target.value}))}
                  placeholder="10-digit mobile"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Max Discount % (Optional)</label>
                <Input 
                  type="number" 
                  min="0"
                  max="100"
                  value={newSalesperson.max_discount_approval_percent || ""} 
                  onChange={e => setNewSalesperson(prev => ({...prev, max_discount_approval_percent: parseFloat(e.target.value) || 0}))}
                  placeholder="e.g. 10"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Maximum discount this salesperson can approve in the Manual Quote Builder.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Zone Assignments</label>
                <div className="flex flex-wrap gap-2 mt-2">
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
                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${isSelected ? 'bg-primary border-primary text-primary-foreground shadow-sm' : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'}`}
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
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Deploy Agent
                </button>
                <button 
                  onClick={() => setShowAddSalesperson(false)}
                  className="px-6 bg-secondary text-secondary-foreground font-semibold text-sm rounded-xl hover:bg-secondary/80 transition-colors"
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
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddZone(false)} />
          <div className="relative bg-card w-full max-w-lg rounded-2xl p-6 shadow-lg border border-border animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold text-foreground tracking-tight mb-6">Define Coverage Zone</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Zone Name</label>
                <Input 
                  type="text" 
                  value={newZone.name || ""} 
                  onChange={e => setNewZone(prev => ({...prev, name: e.target.value}))}
                  placeholder="e.g. South Delhi"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Pincodes (Comma Separated)</label>
                <textarea 
                  rows={4}
                  value={newZone.pincodes?.join(", ") || ""} 
                  onChange={e => setNewZone(prev => ({...prev, pincodes: e.target.value.split(",").map(p => p.trim()).filter(p => p !== "")}))}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="110001, 110002, 110003..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={handleAddZone}
                  disabled={isSaving}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} Establish Zone
                </button>
                <button 
                  onClick={() => setShowAddZone(false)}
                  className="px-6 bg-secondary text-secondary-foreground font-semibold text-sm rounded-xl hover:bg-secondary/80 transition-colors"
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
