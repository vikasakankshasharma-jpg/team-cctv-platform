"use client";

import { useEffect, useState, useRef, Fragment, useMemo } from "react";
import { usePincodeCoverage, PincodeData } from "@/hooks/usePincodeCoverage";
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
  Pencil
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { toast } from "sonner";
import type { Salesperson, CoverageZone } from "@/types";

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


import { useJsApiLoader, GoogleMap, Marker, InfoWindow, Circle } from "@react-google-maps/api";

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
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  });

  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [zones, setZones] = useState<CoverageZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [hoveredPincodes, setHoveredPincodes] = useState<string[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Form states
  const [showAddSalesperson, setShowAddSalesperson] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
  const [newSalesperson, setNewSalesperson] = useState<Partial<Salesperson>>({
    is_active: true,
    assigned_zone_ids: []
  });

  const [showAddZone, setShowAddZone] = useState(false);
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
  const [rawPincodes, setAvailablePincodes] = useState<PincodeData[]>([]);
  const { enrichedPincodes: availablePincodes, getOverlappingPincodes } = usePincodeCoverage(isLoaded, rawPincodes);

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

  // Helper to compute grouped pincodes from offices
  const computePincodesFromOffices = (offices: any[]) => {
    const map = new Map<string, { areas: Set<string>, lat?: number, lng?: number }>();
    offices.forEach((o: any) => {
      if (!o.pincode) return;
      if (!map.has(o.pincode)) map.set(o.pincode, { areas: new Set(), lat: undefined, lng: undefined });
      if (o.officeName) map.get(o.pincode)!.areas.add(o.officeName);
      if (!map.get(o.pincode)!.lat && o.latitude && o.longitude) {
         map.get(o.pincode)!.lat = o.latitude;
         map.get(o.pincode)!.lng = o.longitude;
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([pincode, data]) => ({
        pincode,
        areas: Array.from(data.areas).slice(0, 4), // For UI short display
        allAreas: Array.from(data.areas), // For precise geocoding
        lat: data.lat,
        lng: data.lng,
        radius: 4000 // default initial radius in meters
      }));
  };

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || typeof google === 'undefined') return;
    
    setIsGeocoding(true);
    const geocoder = new window.google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({ location: e.latLng });
      const results = response.results;
      
      if (results && results.length > 0) {
        let foundPincode = "";
        for (const res of results) {
          const postalComponent = res.address_components.find(c => c.types.includes("postal_code"));
          if (postalComponent) {
            foundPincode = postalComponent.long_name;
            break;
          }
        }
        
        if (foundPincode) {
          const pinExists = availablePincodes.some(p => p.pincode === foundPincode);
          if (pinExists) {
            setNewZone(prev => {
              const prevPins = prev.pincodes || [];
              const isSelected = prevPins.includes(foundPincode);
              
              if (isSelected) {
                toast.success(`Unselected area (PINCODE ${foundPincode})`);
                return { ...prev, pincodes: prevPins.filter(code => code !== foundPincode) };
              } else {
                toast.success(`Selected area (PINCODE ${foundPincode})`);
                return { ...prev, pincodes: Array.from(new Set([...prevPins, foundPincode])) };
              }
            });
          } else {
            toast.error(`Area PINCODE (${foundPincode}) is outside your selected District.`);
          }
        } else {
          toast.error("Could not determine PINCODE for this location.");
        }
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      toast.error("Failed to lookup this area. Please try again.");
    } finally {
      setIsGeocoding(false);
    }
  };

  // Handle District Selection
  const handleSelectDistrict = (slug: string, name: string) => {
    if (!selectedState) return;
    setSelectedDistrict({ name, slug });
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

      const res = await fetch("/api/admin/coverage-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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

  // Handle map hover to find all overlapping pincode circles
  const handleMapMouseMove = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const overlapping = getOverlappingPincodes(e.latLng.lat(), e.latLng.lng());
    
    // Only update state if the overlapping set has changed
    const currentHovered = hoveredPincodes.slice().sort().join(",");
    const newHovered = overlapping.slice().sort().join(",");
    
    if (currentHovered !== newHovered) {
      setHoveredPincodes(overlapping);
    }
  };

  // Memoize map center so it doesn't recalculate and re-center on every click (state change)
  const mapCenter = useMemo(() => {
    const first = availablePincodes.find(p => p.lat && p.lng);
    return first ? { lat: first.lat!, lng: first.lng! } : { lat: 20.5937, lng: 78.9629 };
  }, [availablePincodes]);

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
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddZone(false)} />
          <div className="relative bg-card w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold text-foreground tracking-tight mb-1">Define Coverage Zone</h2>
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
                    {availablePincodes.length > 0 && isLoaded && (
                      <div className="flex bg-muted p-0.5 rounded-md">
                        <button 
                          type="button"
                          onClick={() => setViewMode("list")}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-sm transition-all ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                        >
                          List
                        </button>
                        <button 
                          type="button"
                          onClick={() => setViewMode("map")}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-sm transition-all ${viewMode === "map" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                        >
                          Map
                        </button>
                      </div>
                    )}
                  </div>
                  {availablePincodes.length > 0 && (
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => {
                          const allPins = availablePincodes.map(p => p.pincode);
                          setNewZone(prev => ({
                            ...prev,
                            pincodes: Array.from(new Set([...(prev.pincodes || []), ...allPins]))
                          }));
                        }}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-muted-foreground text-xs">•</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const currentPins = new Set(availablePincodes.map(p => p.pincode));
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

                {loadingOffices ? (
                  <div className="p-8 border rounded-xl bg-muted/20 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    Fetching all official post offices & pincodes in {selectedDistrict?.name}...
                  </div>
                ) : availablePincodes.length > 0 ? (
                  viewMode === "list" ? (
                    <div className="p-3 border rounded-xl bg-muted/20 animate-in slide-in-from-top-1">
                      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-2">
                        {availablePincodes.map(p => {
                          const isParentSelected = (newZone.pincodes || []).includes(p.pincode);
                          return (
                            <div key={p.pincode} className="flex flex-col gap-1 mb-2 bg-white rounded-xl border p-1 shadow-sm">
                              <label 
                                className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
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

                              {p.areas.length > 0 && (
                                <div className="pl-7 pr-2 pb-2 flex flex-col gap-1 border-t pt-2 mt-1">
                                  {p.areas.map(area => {
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
                  ) : (
                    <div className="p-1 border rounded-xl bg-muted/20 animate-in slide-in-from-top-1 h-64 overflow-hidden relative">
                      {isLoaded ? (
                        <>
                          <GoogleMap 
                            mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '0.5rem' }} 
                            center={mapCenter}
                            zoom={10}
                            options={{ 
                              disableDefaultUI: true, 
                              zoomControl: true, 
                              fullscreenControl: true,
                              styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }] 
                            }}
                            onClick={handleMapClick}
                            onMouseMove={handleMapMouseMove}
                          >
                            {availablePincodes.filter(p => p.lat && p.lng).map(p => {
                              const isSelected = (newZone.pincodes || []).includes(p.pincode);
                              const isHovered = hoveredPincodes.includes(p.pincode);
                              return (
                                <Fragment key={p.pincode}>
                                  <Marker 
                                    position={{ lat: p.lat!, lng: p.lng! }}
                                    onMouseOver={() => setHoveredPincodes([p.pincode])}
                                    onMouseOut={() => setHoveredPincodes([])}
                                    onClick={() => {
                                      if (isSelected) {
                                        setNewZone(prev => ({...prev, pincodes: (prev.pincodes || []).filter(code => code !== p.pincode)}));
                                      } else {
                                        setNewZone(prev => ({...prev, pincodes: Array.from(new Set([...(prev.pincodes || []), p.pincode]))}));
                                      }
                                    }}
                                    icon={{
                                      path: typeof google !== 'undefined' ? google.maps.SymbolPath.CIRCLE : 0,
                                      fillColor: isSelected ? "#10b981" : "#ef4444",
                                      fillOpacity: 1,
                                      strokeWeight: 2,
                                      strokeColor: "#ffffff",
                                      scale: 8,
                                    }}
                                  />
                                  {isHovered && (
                                    <>
                                      <InfoWindow 
                                        position={{ lat: p.lat!, lng: p.lng! }} 
                                        options={{ disableAutoPan: true, pixelOffset: typeof google !== 'undefined' ? new google.maps.Size(0, -10) : undefined }}
                                      >
                                        <div className="p-1 max-w-[200px]">
                                          <p className="font-bold text-sm text-foreground mb-1">{p.pincode}</p>
                                          <p className="text-xs text-muted-foreground leading-tight whitespace-pre-wrap">{p.areas.join(", ")}</p>
                                        </div>
                                      </InfoWindow>
                                      <Circle
                                        center={{ lat: p.lat!, lng: p.lng! }}
                                        radius={p.radius || 4000}
                                        options={{
                                          fillColor: isSelected ? "#10b981" : "#ef4444",
                                          fillOpacity: 0.15,
                                          strokeColor: isSelected ? "#10b981" : "#ef4444",
                                          strokeOpacity: 0.8,
                                          strokeWeight: 2,
                                          clickable: false
                                        }}
                                      />
                                    </>
                                  )}
                                </Fragment>
                              );
                            })}
                          </GoogleMap>
                          {isGeocoding && (
                            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-[100] rounded-lg">
                              <div className="bg-background border shadow-lg rounded-xl px-4 py-2 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span className="text-sm font-medium">Identifying Area...</span>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Map...
                        </div>
                      )}
                    </div>
                  )
                ) : selectedDistrict ? (
                  <div className="p-4 border rounded-xl bg-muted/10 text-center text-xs text-muted-foreground">
                    No pincodes returned for this selection.
                  </div>
                ) : (
                  <div className="p-6 border border-dashed rounded-xl bg-muted/10 text-center text-xs text-muted-foreground">
                    Select a State and District above to automatically load all official PINCODEs.
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
