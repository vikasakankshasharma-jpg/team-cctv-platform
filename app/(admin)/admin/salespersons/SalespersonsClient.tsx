"use client";

import { useEffect, useState, useRef, Fragment, useMemo } from "react";

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
  AlertCircle,
  ChevronDown,
  Check,
  Pencil,
  Map as MapIcon
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { toast } from "sonner";
import type { Salesperson, CoverageZone } from "@/types";
import { TerritoryMatrix } from "./TerritoryMatrix";
import { computeDistrictPincodes } from "@/lib/geo-utils";
import MapplsBoundaryMap from "@/components/MapplsBoundaryMap";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface SearchableDropdownProps {
  label: string;
  placeholder: string;
  value: string;
  displayValue?: string;
  options: { label: string; value: string }[];
  onSelect: (value: string, label: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

function SearchableDropdown({
  label,
  placeholder,
  value,
  displayValue,
  options,
  onSelect,
  disabled = false,
  loading = false,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          placeholder={loading ? "Loading..." : placeholder}
          value={isOpen ? filterText : (displayValue || "")}
          onFocus={() => {
            setFilterText("");
            setIsOpen(true);
          }}
          onChange={(e) => {
            setFilterText(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-8"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
        ) : (
          <ChevronDown className={`w-4 h-4 absolute right-2.5 top-3 text-muted-foreground pointer-events-none transition-transform ${isOpen ? "rotate-180" : ""}`} />
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[70] mt-1 max-h-52 w-full overflow-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-xl">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground text-center">
              No matching options found
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onSelect(opt.value, opt.label);
                  setIsOpen(false);
                  setFilterText("");
                }}
                className={`cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground flex items-center justify-between ${
                  opt.value === value ? "bg-primary/10 text-primary font-semibold" : ""
                }`}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check className="w-4 h-4 text-primary" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}



function formatCreatedDate(val: any): string {
  if (!val) return "Recently";
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "Recently" : d.toLocaleDateString();
  }
  if (typeof val === "number") {
    return new Date(val).toLocaleDateString();
  }
  if (val.seconds || val._seconds) {
    const sec = val.seconds || val._seconds;
    return new Date(sec * 1000).toLocaleDateString();
  }
  return "Recently";
}

export default function SalespersonsClient() {
  const isLoaded = false;

  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [zones, setZones] = useState<CoverageZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"directory" | "matrix">("directory");

  const filteredSalespersons = useMemo(() => {
    if (!globalSearch.trim()) return salespersons;
    const q = globalSearch.toLowerCase();
    return salespersons.filter(s => {
      if (s.name?.toLowerCase().includes(q)) return true;
      if (s.mobile_number?.includes(q)) return true;
      const assignedZones = zones.filter(z => (s.assigned_zone_ids || []).includes(z.id!));
      for (const z of assignedZones) {
        if (z.name?.toLowerCase().includes(q)) return true;
        if (z.pincodes?.some(pin => pin.includes(q))) return true;
      }
      return false;
    });
  }, [salespersons, zones, globalSearch]);

  const filteredZones = useMemo(() => {
    if (!globalSearch.trim()) return zones;
    const q = globalSearch.toLowerCase();
    return zones.filter(z => {
      if (z.name?.toLowerCase().includes(q)) return true;
      if (z.pincodes?.some(pin => pin.includes(q))) return true;
      return false;
    });
  }, [zones, globalSearch]);

  // Form states
  const [showAddSalesperson, setShowAddSalesperson] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
  const [newSalesperson, setNewSalesperson] = useState<Partial<Salesperson>>({
    is_active: true,
    assigned_zone_ids: []
  });

  const [showAddZone, setShowAddZone] = useState(false);
  const [showZoneMap, setShowZoneMap] = useState(true);
  const [modalMapQuery, setModalMapQuery] = useState<{ type: 'district' | 'pincode'; query: string } | null>(null);
  const [newZone, setNewZone] = useState<Partial<CoverageZone>>({
    pincodes: []
  });

  // Geographic Hierarchy State (State -> District -> City -> Pincodes)
  const [geoStates, setGeoStates] = useState<{ label: string; value: string }[]>([]);
  const [selectedState, setSelectedState] = useState<{ name: string; slug: string } | null>(null);
  const [geoDistricts, setGeoDistricts] = useState<{ label: string; value: string }[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<{ name: string; slug: string } | null>(null);
  const [geoCities, setGeoCities] = useState<{ label: string; value: string }[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [districtOffices, setDistrictOffices] = useState<any[]>([]);
  const [availablePincodes, setAvailablePincodes] = useState<{ pincode: string, areas: string[] }[]>([]);

  const [zonePincodeSearch, setZonePincodeSearch] = useState("");
  
  const filteredAvailablePincodes = useMemo(() => {
    if (!zonePincodeSearch.trim()) return availablePincodes;
    const q = zonePincodeSearch.toLowerCase();
    return availablePincodes.filter(p => 
      p.pincode.includes(q) || 
      (p.areas || []).some((a: string) => a.toLowerCase().includes(q))
    );
  }, [availablePincodes, zonePincodeSearch]);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(false);

  // Load all States on modal open
  useEffect(() => {
    if (showAddZone && geoStates.length === 0) {
      setLoadingStates(true);
      fetch(`/api/admin/geo?type=states&_t=${Date.now()}`)
        .then(async r => {
          if (!r.ok) throw new Error("Proxy error");
          const data = await r.json();
          if (data.error || !Array.isArray(data)) throw new Error(data.error || "Invalid format");
          return data;
        })
        .catch(() => fetch("https://aniket-thapa.github.io/india-pincode-api/states.json").then(r => r.json()))
        .then(data => {
          if (Array.isArray(data)) {
            const sorted = data
              .map((s: any) => ({ label: s.name, value: s.slug }))
              .sort((a, b) => a.label.localeCompare(b.label));
            setGeoStates(sorted);
          }
        })
        .catch(err => {
          console.error(err);
          toast.error("Failed to load Indian states");
        })
        .finally(() => setLoadingStates(false));
    }
  }, [showAddZone, geoStates.length]);

  // Handle State Selection
  const handleSelectState = (slug: string, name: string) => {
    setSelectedState({ name, slug });
    setSelectedDistrict(null);
    setModalMapQuery(null);
    setGeoDistricts([]);
    setSelectedCity("all");
    setGeoCities([]);
    setDistrictOffices([]);
    setAvailablePincodes([]);
    setLoadingDistricts(true);

    fetch(`/api/admin/geo?type=districts&state=${slug}&_t=${Date.now()}`)
      .then(async r => {
        if (!r.ok) throw new Error("Proxy error");
        const data = await r.json();
        if (data.error || !data.districts || !Array.isArray(data.districts)) throw new Error(data.error || "Invalid format");
        return data;
      })
      .catch(() => fetch(`https://aniket-thapa.github.io/india-pincode-api/states/${slug}.json`).then(r => r.json()))
      .then(data => {
        if (data?.districts && Array.isArray(data.districts)) {
          const sorted = data.districts
            .map((d: any) => ({ label: d.name, value: d.slug }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label));
          setGeoDistricts(sorted);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load districts");
      })
      .finally(() => setLoadingDistricts(false));
  };

  // Helper to compute grouped pincodes from offices with verified district coordinates
  const computePincodesFromOffices = (offices: any[]) => {
    return computeDistrictPincodes(offices);
  };


  // Handle District Selection
  const handleSelectDistrict = (slug: string, name: string) => {
    if (!selectedState) return;
    setSelectedDistrict({ name, slug });
    setModalMapQuery({ type: 'district', query: name });
    setSelectedCity("all");
    setLoadingOffices(true);

    fetch(`/api/admin/geo?type=offices&state=${selectedState.slug}&district=${slug}&_t=${Date.now()}`)
      .then(async r => {
        if (!r.ok) throw new Error("Proxy error");
        const data = await r.json();
        if (data.error || !data.offices || !Array.isArray(data.offices)) throw new Error(data.error || "Invalid format");
        return data;
      })
      .catch(() => fetch(`https://aniket-thapa.github.io/india-pincode-api/districts/${selectedState.slug}/${slug}.json`).then(r => r.json()))
      .then(data => {
        const offices = data?.offices || [];
        setDistrictOffices(offices);

        // Extract sub-cities / divisions
        const divisions = Array.from(new Set(offices.map((o: any) => o.divisionName).filter(Boolean))) as string[];
        const cityOpts = [
          { label: `All in ${name}`, value: "all" },
          ...divisions.map(d => ({ label: d, value: d }))
        ];
        setGeoCities(cityOpts);

        // Group Pincodes
        const grouped = computePincodesFromOffices(offices);
        setAvailablePincodes(grouped);

        // Auto suggest zone name if empty
        setNewZone(prev => ({
          ...prev,
          name: prev.name || `${name}, ${selectedState.name}`
        }));

        toast.success(`Loaded ${grouped.length} pincodes in ${name}`);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load district pincodes");
      })
      .finally(() => setLoadingOffices(false));
  };

  // Handle City / Division Filter Selection
  const handleSelectCity = (val: string) => {
    setSelectedCity(val);
    const filteredOffices = val === "all" 
      ? districtOffices 
      : districtOffices.filter(o => o.divisionName === val);
    
    const grouped = computePincodesFromOffices(filteredOffices);
    setAvailablePincodes(grouped);
  };

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


  async function handleUpdateSalesperson() {
    if (!editingSalesperson || !editingSalesperson.id) return;
    if (!editingSalesperson.name || !editingSalesperson.mobile_number) {
      toast.error("Name and Mobile are required");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/salespersons/${editingSalesperson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSalesperson)
      });
      if (res.ok) {
        toast.success("Agent information updated successfully");
        setEditingSalesperson(null);
        fetchData();
      } else {
        toast.error("Failed to update agent");
      }
    } catch (err) {
      toast.error("Error updating agent");
    } finally {
      setIsSaving(false);
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
      const enrichedPincodesData = (newZone.pincodes || [])
        .map(pin => availablePincodes.find(p => p.pincode === pin))
        .filter(Boolean);
        
      const payload = {
        ...newZone,
        pincodes_data: enrichedPincodesData
      };

      const isEditing = !!newZone.id;
      const url = isEditing ? `/api/admin/coverage-zones/${newZone.id}` : "/api/admin/coverage-zones";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(isEditing ? "Zone updated" : "Zone added");
        setShowAddZone(false);
        setNewZone({ pincodes: [] });
        fetchData();
      }
    } catch (err) {
      toast.error("Error saving zone");
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

      {/* PHASE 1: Metrics & Global Search */}
      <div className="space-y-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 rounded-xl flex items-center justify-between border-border shadow-sm bg-card transition-all">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Salespersons</p>
              <h4 className="text-2xl font-bold text-foreground tracking-tight">{salespersons.length}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
          </Card>
          
          <Card 
            onClick={() => setActiveTab("matrix")}
            className="p-4 rounded-xl flex items-center justify-between border-border shadow-sm bg-card transition-all cursor-pointer hover:bg-success/5 hover:border-success/30"
            title="Click to view full Territory Matrix"
          >
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Covered PINCODEs</p>
              <h4 className="text-2xl font-bold text-foreground tracking-tight">
                {new Set(zones.flatMap(z => z.pincodes || [])).size}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
              <MapPin className="w-5 h-5" />
            </div>
          </Card>

          <Card 
            onClick={() => setActiveTab("matrix")}
            className="p-4 rounded-xl flex items-center justify-between border-border shadow-sm bg-card transition-all cursor-pointer hover:bg-secondary/30"
            title="Click to view full Territory Matrix"
          >
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Serviceable Zones</p>
              <h4 className="text-2xl font-bold text-foreground tracking-tight">{zones.length}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
              <Globe className="w-5 h-5" />
            </div>
          </Card>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input 
            className="pl-12 text-sm bg-card border-border shadow-sm focus:bg-background h-12 rounded-xl text-foreground"
            placeholder="Search by salesperson name, mobile number, PINCODE, or city..."
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-border pb-px mt-6">
        <button 
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === "directory" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Directory
        </button>
        <button 
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === "matrix" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Territory Matrix
        </button>
      </div>

      {activeTab === "directory" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        
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
            {filteredSalespersons.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border">
                No salespersons found.
              </div>
            ) : null}
            {filteredSalespersons.map(s => (
              <Card key={s.id} className="p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group relative border-border bg-card">
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => setEditingSalesperson(s)}
                    title="Edit Agent Details"
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteSalesperson(s.id!)}
                    title="Remove Agent"
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
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
                       <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase font-semibold">
                          All Zones (Unrestricted)
                        </Badge>
                     )}
                   </div>
                   
                   <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${s.is_active ? 'bg-success/10 text-success border border-success/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                        {s.is_active ? 'Online' : 'Offline'}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground italic">
                         Added {formatCreatedDate(s.created_at)}
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
              onClick={() => { setNewZone({ pincodes: [] }); setShowAddZone(true); }}
              className="p-2 bg-secondary text-secondary-foreground rounded-full hover:bg-primary/10 hover:text-primary transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {filteredZones.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border">
                No coverage zones found.
              </div>
            ) : null}
            {filteredZones.map(z => (
              <Card key={z.id} className="p-4 rounded-xl flex items-center justify-between group border-border shadow-sm bg-card cursor-pointer hover:bg-secondary/20 transition-all" onClick={() => { setNewZone(z); setShowAddZone(true); }}>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
                    {z.name}
                    <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                      {salespersons.filter(s => (s.assigned_zone_ids || []).includes(z.id!)).length} Agents
                    </span>
                  </h5>
                  <p className="text-xs text-muted-foreground font-medium mt-1 truncate max-w-[180px]" title={z.pincodes.join(", ")}>
                    {z.pincodes.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setNewZone(z); setShowAddZone(true); }}
                    className="p-2 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                    title="Edit Zone"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteZone(z.id!); }}
                    className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete Zone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
      )}

      {activeTab === "matrix" && (
        <TerritoryMatrix zones={zones} salespersons={salespersons} isLoaded={isLoaded} />
      )}

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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Zone Assignments <span className="text-[11px] font-normal text-muted-foreground lowercase">(optional)</span>
                </label>
                {zones.length === 0 ? (
                  <div className="p-3 bg-muted/40 rounded-xl border border-dashed border-border text-xs text-muted-foreground mt-2">
                    No coverage zones defined yet. This agent will have <strong>unrestricted access</strong> across all areas by default. You can define zones later.
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-muted-foreground mt-1 mb-2">
                      Select zones to restrict this agent, or leave unselected for unrestricted access across all territories.
                    </p>
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
                  </>
                )}
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

      
      {/* Edit Agent Modal */}
      {editingSalesperson && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditingSalesperson(null)} />
          <div className="relative bg-card w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold text-foreground tracking-tight mb-1">Edit Agent Information</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Update salesperson credentials, authorization thresholds, and assigned territories.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name</label>
                <Input 
                  type="text" 
                  value={editingSalesperson.name || ""} 
                  onChange={e => setEditingSalesperson(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  placeholder="e.g. Vikas Kumar Sharma"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Mobile (WhatsApp for OTP)</label>
                <Input 
                  type="tel" 
                  value={editingSalesperson.mobile_number || ""} 
                  onChange={e => setEditingSalesperson(prev => prev ? ({ ...prev, mobile_number: e.target.value }) : null)}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Max Discount % (Optional)</label>
                <Input 
                  type="number" 
                  min="0"
                  max="100"
                  value={editingSalesperson.max_discount_approval_percent ?? ""} 
                  onChange={e => setEditingSalesperson(prev => prev ? ({ ...prev, max_discount_approval_percent: parseFloat(e.target.value) || 0 }) : null)}
                  placeholder="e.g. 10"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Maximum discount this salesperson can approve in the Manual Quote Builder.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Account Status</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setEditingSalesperson(prev => prev ? ({ ...prev, is_active: true }) : null)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      editingSalesperson.is_active 
                        ? 'bg-success/15 border-success text-success shadow-sm' 
                        : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    Online / Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSalesperson(prev => prev ? ({ ...prev, is_active: false }) : null)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      !editingSalesperson.is_active 
                        ? 'bg-destructive/15 border-destructive text-destructive shadow-sm' 
                        : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    Offline / Deactivated
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Zone Assignments <span className="text-[11px] font-normal text-muted-foreground lowercase">(optional)</span>
                </label>
                {zones.length === 0 ? (
                  <div className="p-3 bg-muted/40 rounded-xl border border-dashed border-border text-xs text-muted-foreground mt-2">
                    No coverage zones defined yet. This agent currently has <strong>unrestricted access</strong> across all areas.
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-muted-foreground mt-1 mb-2">
                      Select zones to restrict this agent, or leave unselected for unrestricted access across all territories.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {zones.map(z => {
                        const isSelected = editingSalesperson.assigned_zone_ids?.includes(z.id!);
                        return (
                          <button 
                            key={z.id}
                            type="button"
                            onClick={() => {
                              const current = editingSalesperson.assigned_zone_ids || [];
                              if (isSelected) {
                                setEditingSalesperson(prev => prev ? ({ ...prev, assigned_zone_ids: current.filter(id => id !== z.id) }) : null);
                              } else {
                                setEditingSalesperson(prev => prev ? ({ ...prev, assigned_zone_ids: [...current, z.id!] }) : null);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${isSelected ? 'bg-primary border-primary text-primary-foreground shadow-sm' : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'}`}
                          >
                            {z.name}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={handleUpdateSalesperson}
                  disabled={isSaving}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                </button>
                <button 
                  onClick={() => setEditingSalesperson(null)}
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
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setShowAddZone(false); setNewZone({ pincodes: [] }); }} />
          <div className="relative bg-card w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold text-foreground tracking-tight mb-1">{newZone.id ? "Update Coverage Zone" : "Define Coverage Zone"}</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Select State, District, and City to view and map all official PINCODEs with single-click Select All.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Zone Name</label>
                <Input 
                  type="text" 
                  value={newZone.name || ""} 
                  onChange={e => setNewZone(prev => ({...prev, name: e.target.value}))}
                  placeholder="e.g. Jaipur, Rajasthan"
                />
              </div>

              {/* 3-Tier Cascading Geographic Dropdowns with real-time text filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. State Selector */}
                <SearchableDropdown
                  label="1. Select State"
                  placeholder="Type to filter states (e.g. Rajasthan)"
                  value={selectedState?.slug || ""}
                  displayValue={selectedState?.name || ""}
                  options={geoStates}
                  onSelect={handleSelectState}
                  loading={loadingStates}
                />

                {/* 2. District Selector */}
                <SearchableDropdown
                  label="2. Select District"
                  placeholder={selectedState ? "Type to filter districts (e.g. Jaipur)" : "Select State first"}
                  value={selectedDistrict?.slug || ""}
                  displayValue={selectedDistrict?.name || ""}
                  options={geoDistricts}
                  onSelect={handleSelectDistrict}
                  disabled={!selectedState || loadingDistricts}
                  loading={loadingDistricts}
                />
              </div>

              {/* 3. City / Sub-Division Filter */}
              {selectedDistrict && geoCities.length > 1 && (
                <div className="animate-in fade-in duration-200">
                  <SearchableDropdown
                    label="3. Select City / Division"
                    placeholder="Filter by City / Division or All"
                    value={selectedCity}
                    displayValue={selectedCity === "all" ? `All in ${selectedDistrict.name}` : selectedCity}
                    options={geoCities}
                    onSelect={handleSelectCity}
                    disabled={loadingOffices}
                    loading={loadingOffices}
                  />
                </div>
              )}



              {/* Pincodes Multi-Selection Box */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Available PINCODEs {availablePincodes.length > 0 && `(${availablePincodes.length} Found)`}
                    </label>
                  </div>
                  {availablePincodes.length > 0 && (
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => {
                          const allPins = filteredAvailablePincodes.map(p => p.pincode);
                          setNewZone(prev => ({
                            ...prev,
                            pincodes: Array.from(new Set([...(prev.pincodes || []), ...allPins]))
                          }));
                        }}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-muted-foreground text-xs">·</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const currentPins = new Set(filteredAvailablePincodes.map(p => p.pincode));
                          setNewZone(prev => ({
                            ...prev,
                            pincodes: (prev.pincodes || []).filter(p => !currentPins.has(p))
                          }));
                        }}
                        className="text-xs text-destructive font-semibold hover:underline"
                      >
                        Unselect All
                      </button>
                    </div>
                  )}
                </div>

                {availablePincodes.length > 0 && (
                  <div className="mb-3 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search specific PINCODE or Area..."
                      className="pl-9 h-9 text-sm bg-secondary/30"
                      value={zonePincodeSearch}
                      onChange={(e) => setZonePincodeSearch(e.target.value)}
                    />
                  </div>
                )}

                {loadingOffices ? (
                  <div className="p-8 border rounded-xl bg-muted/20 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    Fetching all official post offices & pincodes in {selectedDistrict?.name}...
                  </div>
                ) : availablePincodes.length > 0 ? (
                    <div className="p-3 border rounded-xl bg-muted/20 animate-in slide-in-from-top-1">
                      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-2">
                        {filteredAvailablePincodes.length === 0 ? (
                          <div className="text-center p-4 text-xs text-muted-foreground italic">
                            No matching PINCODEs found for "{zonePincodeSearch}".
                          </div>
                        ) : filteredAvailablePincodes.map(p => {
                          const isParentSelected = (newZone.pincodes || []).includes(p.pincode);
                          return (
                            <div key={p.pincode} className="flex flex-col gap-1 mb-2 bg-white rounded-xl border p-1 shadow-sm">
                              <div className="flex items-center justify-between group pr-2">
                                <label 
                                  className={`flex-1 flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
                                    isParentSelected 
                                      ? 'bg-primary/10 text-foreground font-medium' 
                                      : 'hover:bg-muted/60 text-muted-foreground'
                                  }`}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isParentSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        // Remove any specific sub-areas for this pincode, and just add the parent pincode
                                        setNewZone(prev => ({
                                          ...prev, 
                                          pincodes: Array.from(new Set([
                                            ...(prev.pincodes || []).filter(code => !code.startsWith(p.pincode + ':')), 
                                            p.pincode
                                          ]))
                                        }));
                                      } else {
                                        setNewZone(prev => ({
                                          ...prev, 
                                          pincodes: (prev.pincodes || []).filter(code => code !== p.pincode)
                                        }));
                                      }
                                    }}
                                    className="mt-0.5 rounded border-input text-primary focus:ring-primary h-4 w-4" 
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold tracking-wide">ALL OF {p.pincode}</span>
                                  </div>
                                </label>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setModalMapQuery({ type: 'pincode', query: p.pincode });
                                    setShowZoneMap(true);
                                  }}
                                  className="ml-2 px-2.5 py-1 bg-secondary text-foreground text-[10px] font-bold rounded-md hover:bg-primary/20 hover:text-primary transition-colors shrink-0 flex items-center gap-1"
                                >
                                  <MapIcon className="w-3 h-3" />
                                  MAP
                                </button>
                              </div>

                              {p.areas.length > 0 && (
                                <div className="pl-7 pr-2 pb-2 flex flex-col gap-1 border-t pt-2 mt-1">
                                  {p.areas.map((area: string) => {
                                    const areaCode = `${p.pincode}:${area}`;
                                    const isSelected = isParentSelected || (newZone.pincodes || []).includes(areaCode);
                                    
                                    return (
                                      <label key={areaCode} className={`flex items-start gap-2 p-1.5 rounded-md cursor-pointer transition-all ${
                                        isSelected 
                                          ? 'bg-blue-50 text-blue-900 font-medium' 
                                          : 'hover:bg-muted/40 text-muted-foreground'
                                      }`}>
                                        <input 
                                          type="checkbox" 
                                          checked={isSelected}
                                          disabled={isParentSelected}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setNewZone(prev => ({...prev, pincodes: Array.from(new Set([...(prev.pincodes || []), areaCode]))}));
                                            } else {
                                              setNewZone(prev => ({...prev, pincodes: (prev.pincodes || []).filter(code => code !== areaCode)}));
                                            }
                                          }}
                                          className="mt-0.5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 disabled:opacity-50" 
                                        />
                                        <span className="text-xs leading-tight">{area}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                ) : selectedDistrict ? (
                  <div className="p-4 border rounded-xl bg-muted/10 text-center text-xs text-muted-foreground">
                    No pincodes returned for this selection.
                  </div>
                ) : (
                  <div className="p-6 border border-dashed rounded-xl bg-muted/10 text-center text-xs text-muted-foreground">
                    Select a State and District above to automatically load all official PINCODEs.
                  </div>
                )}

                {/* MapmyIndia Coverage Boundary Preview (Moved Below List) */}
                {selectedDistrict && (
                  <div className="border border-border rounded-xl p-3 bg-secondary/10 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-primary/10 text-primary">
                          <MapIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-foreground">
                          MapmyIndia Boundary ({modalMapQuery?.type === 'pincode' ? `Pincode: ${modalMapQuery.query}` : `District: ${selectedDistrict.name}`})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {modalMapQuery?.type === 'pincode' && (
                          <button
                            type="button"
                            onClick={() => setModalMapQuery({ type: 'district', query: selectedDistrict.name })}
                            className="text-[11px] text-primary hover:underline font-semibold"
                          >
                            Reset to District
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowZoneMap(!showZoneMap)}
                          className="text-[11px] text-muted-foreground hover:text-foreground font-medium underline"
                        >
                          {showZoneMap ? "Hide Map" : "Show Map"}
                        </button>
                      </div>
                    </div>

                    {showZoneMap && (
                      <MapplsBoundaryMap 
                        apiKey={process.env.NEXT_PUBLIC_MAPPLS_API_KEY || ''}
                        boundaryType={modalMapQuery?.type || 'district'}
                        boundaryQuery={modalMapQuery?.query || selectedDistrict.name}
                        height="260px"
                      />
                    )}
                  </div>
                )}

                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between mt-4">
                  <span>Selected Pincodes Summary</span>
                  <Badge variant="secondary" className="font-semibold text-primary">
                    {(newZone.pincodes || []).length} Selected
                  </Badge>
                </label>
                <textarea 
                  rows={2}
                  value={newZone.pincodes?.join(", ") || ""} 
                  onChange={e => setNewZone(prev => ({...prev, pincodes: e.target.value.split(",").map(p => p.trim()).filter(p => p !== "")}))}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Pincodes will auto-populate here from checkboxes above, or you can paste manually..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={handleAddZone}
                  disabled={isSaving || (newZone.pincodes?.length === 0)}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} {newZone.id ? "Update Zone" : "Establish Zone"}
                </button>
                <button 
                  onClick={() => { setShowAddZone(false); setNewZone({ pincodes: [] }); }}
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


