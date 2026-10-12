"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { CoverageZone, Salesperson } from "@/types";
import { 
  Search, 
  Loader2, 
  MapPin, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  Map as MapIcon, 
  RotateCcw, 
  Phone, 
  UserPlus, 
  UserCheck, 
  X, 
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MapplsBoundaryMap from "@/components/MapplsBoundaryMap";
import regionalHubs from "@/data/pincodes.json";
import { toast } from "sonner";

// Custom Searchable Dropdown for compact State and District selection
function SearchableDropdown({
  label,
  value,
  options,
  placeholder,
  disabled = false,
  loading = false,
  onChange,
  icon: Icon = MapPin,
}: {
  label: string;
  value?: string | null;
  options: { label: string; value: string }[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  onChange: (option: { label: string; value: string }) => void;
  icon?: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  const selectedItem = options.find(o => o.value === value || o.label === value);

  return (
    <div className="relative flex-1 min-w-[200px]" ref={dropdownRef}>
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-primary" />
        {label}
      </label>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className={`w-full flex items-center justify-between px-3 py-2 bg-background border rounded-lg text-xs font-medium transition-all shadow-sm ${
          disabled ? 'opacity-50 cursor-not-allowed bg-muted/40 border-border' :
          isOpen ? 'border-primary ring-2 ring-primary/20 bg-background' :
          'border-border hover:border-border/80 hover:bg-secondary/20'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
          ) : (
            <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )}
          <span className={`truncate ${selectedItem ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
            {loading ? "Loading..." : selectedItem ? selectedItem.label : placeholder}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[240px] max-w-[320px] bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="p-2 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${options.length} ${label.toLowerCase()}s...`}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="max-h-[220px] overflow-y-auto divide-y divide-border/20 p-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground italic">
                No matching {label.toLowerCase()} found
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = item.value === value || item.label === value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      onChange(item);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-foreground hover:bg-secondary/70 font-medium"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  zones: CoverageZone[];
  salespersons: Salesperson[];
  isLoaded: boolean;
  onRefresh?: () => void;
}

export function TerritoryMatrix({ zones, salespersons, isLoaded, onRefresh }: Props) {
  const [geoStates, setGeoStates] = useState<{ label: string; value: string }[]>([]);
  const [selectedState, setSelectedState] = useState<{ name: string; slug: string } | null>(null);
  
  const [geoDistricts, setGeoDistricts] = useState<{ label: string; value: string }[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<{ name: string; slug: string } | null>(null);
  
  const [districtOffices, setDistrictOffices] = useState<any[]>([]);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(false);

  const [pincodeFilter, setPincodeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "covered" | "partial" | "uncovered">("all");

  const [activeMapQuery, setActiveMapQuery] = useState<{ type: 'district' | 'pincode'; query: string; label: string } | null>(null);
  const [showMap, setShowMap] = useState<boolean>(true);

  // Quick Assign Modal State
  const [assignModalPincode, setAssignModalPincode] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Sync active map query with selected district
  useEffect(() => {
    if (selectedDistrict) {
      setActiveMapQuery({ type: 'district', query: selectedDistrict.name, label: selectedDistrict.name });
    } else {
      setActiveMapQuery(null);
    }
  }, [selectedDistrict]);

  // Load States
  useEffect(() => {
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
          // Default to Rajasthan if found
          const rajasthan = sorted.find((s: any) => s.label.toLowerCase() === "rajasthan");
          if (rajasthan) setSelectedState({ name: rajasthan.label, slug: rajasthan.value });
        }
      })
      .catch(console.error)
      .finally(() => setLoadingStates(false));
  }, []);

  // Load Districts
  useEffect(() => {
    if (!selectedState) {
      setGeoDistricts([]);
      setSelectedDistrict(null);
      return;
    }
    setLoadingDistricts(true);
    fetch(`/api/admin/geo?type=districts&state=${selectedState.slug}&_t=${Date.now()}`)
      .then(async r => {
        if (!r.ok) throw new Error("Proxy error");
        const data = await r.json();
        if (data.error || !data.districts || !Array.isArray(data.districts)) throw new Error(data.error || "Invalid format");
        return data;
      })
      .catch(() => fetch(`https://aniket-thapa.github.io/india-pincode-api/states/${selectedState.slug}.json`).then(r => r.json()))
      .then(data => {
        if (data?.districts && Array.isArray(data.districts)) {
          const sorted = data.districts
            .map((d: any) => ({ label: d.name, value: d.slug }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label));
          setGeoDistricts(sorted);
          // Default to Jaipur if found
          const jaipur = sorted.find((d: any) => d.label.toLowerCase() === "jaipur");
          if (jaipur && !selectedDistrict) {
            setSelectedDistrict({ name: jaipur.label, slug: jaipur.value });
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingDistricts(false));
  }, [selectedState]);

  // Load Offices (Pincodes)
  useEffect(() => {
    if (!selectedState || !selectedDistrict) {
      setDistrictOffices([]);
      return;
    }
    setLoadingOffices(true);
    fetch(`/api/admin/geo?type=offices&state=${selectedState.slug}&district=${selectedDistrict.slug}&_t=${Date.now()}`)
      .then(async r => {
        if (!r.ok) throw new Error("Proxy error");
        const data = await r.json();
        if (data.error || !data.offices || !Array.isArray(data.offices)) throw new Error(data.error || "Invalid format");
        return data;
      })
      .catch(() => fetch(`https://aniket-thapa.github.io/india-pincode-api/districts/${selectedState.slug}/${selectedDistrict.slug}.json`).then(r => r.json()))
      .then(data => {
        const offices = data?.offices || [];
        setDistrictOffices(offices);
      })
      .catch(console.error)
      .finally(() => setLoadingOffices(false));
  }, [selectedState, selectedDistrict]);

  // Aggregate current coverage
  const coveredPincodesSet = useMemo(() => {
    const set = new Set<string>();
    zones.forEach(z => {
      (z.pincodes || []).forEach(p => set.add(p));
    });
    return set;
  }, [zones]);

  const pincodesInDistrict = useMemo(() => {
    const map = new Map<string, { 
      pincode: string; 
      areas: string[]; 
      totalAreas: number; 
      coveredAreas: number; 
      status: 'covered' | 'partial' | 'uncovered';
      lat?: number;
      lng?: number;
    }>();
    
    districtOffices.forEach(o => {
      const latVal = o.latitude ? parseFloat(String(o.latitude)) : (o.lat ? parseFloat(String(o.lat)) : undefined);
      const lngVal = o.longitude ? parseFloat(String(o.longitude)) : (o.lng ? parseFloat(String(o.lng)) : undefined);

      if (!map.has(o.pincode)) {
        map.set(o.pincode, { 
          pincode: o.pincode, 
          areas: [], 
          totalAreas: 0, 
          coveredAreas: 0, 
          status: 'uncovered',
          lat: latVal && !isNaN(latVal) ? latVal : undefined,
          lng: lngVal && !isNaN(lngVal) ? lngVal : undefined,
        });
      }
      const entry = map.get(o.pincode)!;
      if (!entry.lat && latVal && !isNaN(latVal)) entry.lat = latVal;
      if (!entry.lng && lngVal && !isNaN(lngVal)) entry.lng = lngVal;

      // Extract and clean area names
      const rawArea = o.officeName || o.office || "";
      const cleanArea = String(rawArea).trim();
      if (cleanArea && !/^[.\-_/\s]+$/.test(cleanArea)) {
        if (!entry.areas.includes(cleanArea)) {
          entry.areas.push(cleanArea);
        }
      }
      
      entry.totalAreas += 1;
      
      const isFullyCovered = coveredPincodesSet.has(o.pincode);
      const isAreaCovered = cleanArea ? coveredPincodesSet.has(`${o.pincode}:${cleanArea}`) : false;
      
      if (isFullyCovered || isAreaCovered) {
        entry.coveredAreas += 1;
      }
    });
    
    // Determine status & fallback areas & fallback coordinates
    Array.from(map.values()).forEach(entry => {
      if (coveredPincodesSet.has(entry.pincode) || (entry.totalAreas > 0 && entry.coveredAreas === entry.totalAreas)) {
        entry.status = 'covered';
      } else if (entry.coveredAreas > 0) {
        entry.status = 'partial';
      } else {
        entry.status = 'uncovered';
      }
      // If areas were only dots or empty, fallback to clean district label
      if (entry.areas.length === 0) {
        entry.areas = [`${selectedDistrict?.name || 'Central'} Hub Area`];
      }

      // Fallback coordinate if missing from office
      if (!entry.lat || !entry.lng) {
        const prefix = entry.pincode.slice(0, 3);
        const hub = (regionalHubs as Record<string, { lat: number; lng: number }>)[prefix];
        if (hub) {
          const hash = entry.pincode.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
          const angle = (hash % 360) * (Math.PI / 180);
          const offset = ((hash % 15) + 3) * 0.005;
          entry.lat = hub.lat + Math.cos(angle) * offset;
          entry.lng = hub.lng + Math.sin(angle) * offset;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.pincode.localeCompare(b.pincode));
  }, [districtOffices, coveredPincodesSet, selectedDistrict]);

  // Aggregate map data including assigned agent names
  const pincodesMapData = useMemo(() => {
    return pincodesInDistrict.map(p => {
      const assigned = salespersons.filter(s => {
        const agentZones = zones.filter(z => (s.assigned_zone_ids || []).includes(z.id!));
        return agentZones.some(z => (z.pincodes || []).includes(p.pincode) || (z.pincodes || []).some(code => code.startsWith(p.pincode + ":")));
      });

      return {
        pincode: p.pincode,
        status: p.status,
        lat: p.lat,
        lng: p.lng,
        areas: p.areas,
        agents: assigned.map(a => `${a.name}${a.mobile_number ? ` (${a.mobile_number})` : ''}`),
      };
    });
  }, [pincodesInDistrict, salespersons, zones]);

  const totalInDistrict = pincodesInDistrict.length;
  const fullyCoveredInDistrict = pincodesInDistrict.filter(p => p.status === 'covered').length;
  const partiallyCoveredInDistrict = pincodesInDistrict.filter(p => p.status === 'partial').length;
  const uncoveredInDistrict = totalInDistrict - fullyCoveredInDistrict - partiallyCoveredInDistrict;
  
  // Calculate coverage based on areas for more accuracy
  const totalAreasInDistrict = pincodesInDistrict.reduce((acc, p) => acc + p.totalAreas, 0);
  const coveredAreasInDistrict = pincodesInDistrict.reduce((acc, p) => acc + p.coveredAreas, 0);
  const coveragePercentage = totalAreasInDistrict === 0 ? 0 : Math.round((coveredAreasInDistrict / totalAreasInDistrict) * 100);

  const filteredPincodes = useMemo(() => {
    return pincodesInDistrict.filter(p => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!pincodeFilter.trim()) return true;
      const q = pincodeFilter.toLowerCase();
      if (p.pincode.includes(q)) return true;
      if (p.areas.some(a => a.toLowerCase().includes(q))) return true;

      // Also filter by assigned salesperson name or phone
      const assigned = salespersons.filter(s => {
        const agentZones = zones.filter(z => (s.assigned_zone_ids || []).includes(z.id!));
        return agentZones.some(z => (z.pincodes || []).includes(p.pincode) || (z.pincodes || []).some(code => code.startsWith(p.pincode + ":")));
      });
      if (assigned.some(a => a.name.toLowerCase().includes(q) || a.mobile_number.includes(q))) return true;

      return false;
    });
  }, [pincodesInDistrict, statusFilter, pincodeFilter, salespersons, zones]);

  // Handle Quick Assign Agent
  const handleAssignAgentToPincode = async () => {
    if (!assignModalPincode || !selectedAgentId) return;
    setIsAssigning(true);
    try {
      // Find all zones that cover this pincode
      const matchingZones = zones.filter(z => 
        (z.pincodes || []).includes(assignModalPincode) || 
        (z.pincodes || []).some(code => code.startsWith(assignModalPincode + ":"))
      );

      let targetZoneId = matchingZones[0]?.id;

      // If no zone covers this pincode yet, create or add to a district zone
      if (!targetZoneId) {
        const districtZone = zones.find(z => (z.district || z.city)?.toLowerCase() === selectedDistrict?.name?.toLowerCase());
        if (districtZone?.id) {
          targetZoneId = districtZone.id;
          const updatedPins = Array.from(new Set([...(districtZone.pincodes || []), assignModalPincode]));
          await fetch(`/api/admin/coverage-zones/${targetZoneId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...districtZone, pincodes: updatedPins }),
          });
        } else {
          // Create new zone
          const res = await fetch("/api/admin/coverage-zones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `${selectedDistrict?.name || 'District'} Zone (${assignModalPincode})`,
              state: selectedState?.name || "Rajasthan",
              district: selectedDistrict?.name || "JAIPUR",
              pincodes: [assignModalPincode],
              color: "#2563eb",
            }),
          });
          const created = await res.json();
          targetZoneId = created.id;
        }
      }

      // Add targetZoneId to selected salesperson's assigned_zone_ids
      const agent = salespersons.find(s => s.id === selectedAgentId);
      if (agent && targetZoneId) {
        const currentZones = agent.assigned_zone_ids || [];
        if (!currentZones.includes(targetZoneId)) {
          const updatedZones = [...currentZones, targetZoneId];
          await fetch(`/api/admin/salespersons/${agent.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...agent, assigned_zone_ids: updatedZones }),
          });
        }
      }

      toast.success(`Agent successfully assigned to PIN ${assignModalPincode}!`);
      setAssignModalPincode(null);
      setSelectedAgentId("");
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign agent");
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Unassign Agent
  const handleUnassignAgent = async (agentId: string, pincode: string) => {
    try {
      const agent = salespersons.find(s => s.id === agentId);
      if (!agent) return;

      const agentZonesWithPin = zones.filter(z => 
        (agent.assigned_zone_ids || []).includes(z.id!) && 
        ((z.pincodes || []).includes(pincode) || (z.pincodes || []).some(code => code.startsWith(pincode + ":")))
      );

      const zoneIdsToRemove = new Set(agentZonesWithPin.map(z => z.id!));
      const remainingZones = (agent.assigned_zone_ids || []).filter(zid => !zoneIdsToRemove.has(zid));

      await fetch(`/api/admin/salespersons/${agent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...agent, assigned_zone_ids: remainingZones }),
      });

      toast.success(`Removed ${agent.name} from PIN ${pincode}`);
      onRefresh?.();
    } catch (err: any) {
      toast.error("Failed to unassign agent");
    }
  };

  return (
    <div className="space-y-6 mt-6 animate-in fade-in duration-500">
      
      {/* Sleek Territory Command Bar (Replaces the two giant 180px empty boxes) */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* State & District Searchable Dropdowns */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
            <SearchableDropdown
              label="1. State"
              placeholder="Select State"
              value={selectedState?.slug}
              options={geoStates}
              loading={loadingStates}
              onChange={(s) => {
                setSelectedState({ name: s.label, slug: s.value });
                setSelectedDistrict(null);
              }}
              icon={MapPin}
            />

            <SearchableDropdown
              label="2. District"
              placeholder={!selectedState ? "Select state first..." : "Select District"}
              value={selectedDistrict?.slug}
              options={geoDistricts}
              disabled={!selectedState}
              loading={loadingDistricts}
              onChange={(d) => setSelectedDistrict({ name: d.label, slug: d.value })}
              icon={MapIcon}
            />
          </div>

          {/* District Coverage Summary & Map Toggle */}
          {selectedDistrict ? (
            <div className="flex items-center gap-3 self-end lg:self-center flex-wrap pt-2 lg:pt-0">
              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg border border-border text-xs">
                <span className="font-semibold text-foreground">{totalInDistrict} PINs</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{coveragePercentage}% Covered</span>
                {uncoveredInDistrict > 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-semibold text-rose-500">{uncoveredInDistrict} Gaps</span>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className="h-9 text-xs font-semibold gap-1.5 border-border hover:bg-secondary"
              >
                <MapIcon className="w-3.5 h-3.5 text-primary" />
                {showMap ? "Hide Map" : "Show Map"}
              </Button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic flex items-center gap-1.5 self-center">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              Select state & district to view coverage
            </div>
          )}
        </div>
      </div>

      {/* When no district selected */}
      {!selectedDistrict && (
        <div className="p-12 text-center bg-card border border-border rounded-xl shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Select a District to View Territory Matrix</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            Pick a state and district in the dropdowns above to inspect real-time pincode coverage, technician deployment, and unstaffed gaps.
          </p>
        </div>
      )}

      {/* Analytics Matrix */}
      {selectedDistrict && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in">
          
          {/* Header Row with Progress & Search */}
          <div className="p-4 md:p-6 border-b border-border bg-secondary/20 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-foreground tracking-tight">
                    Coverage Breakdown • {selectedDistrict.name}, {selectedState?.name}
                  </h3>
                  <Badge variant="outline" className="font-mono text-xs bg-primary/5 text-primary border-primary/20">
                    {fullyCoveredInDistrict + partiallyCoveredInDistrict}/{totalInDistrict} PINs Active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pin-level assignment and density breakdown for on-ground sales force
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-secondary rounded-full h-2.5 min-w-[100px]">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${coveragePercentage}%` }}></div>
                  </div>
                  <span className="text-sm font-bold text-foreground">{coveragePercentage}%</span>
                </div>

                <div className="relative w-[220px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    className="pl-9 h-9 text-xs bg-background" 
                    placeholder="Filter PIN, area, or agent..." 
                    value={pincodeFilter} 
                    onChange={e => setPincodeFilter(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Coverage Status Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/50">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filter:
              </span>
              <button
                onClick={() => setStatusFilter("all")}
                className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                  statusFilter === "all" 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                All PINs ({totalInDistrict})
              </button>
              <button
                onClick={() => setStatusFilter("covered")}
                className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                  statusFilter === "covered" 
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                Covered ({fullyCoveredInDistrict})
              </button>
              <button
                onClick={() => setStatusFilter("partial")}
                className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                  statusFilter === "partial" 
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm" 
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                Partial ({partiallyCoveredInDistrict})
              </button>
              <button
                onClick={() => setStatusFilter("uncovered")}
                className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                  statusFilter === "uncovered" 
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm" 
                    : "bg-background text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                }`}
              >
                Uncovered Gaps ({uncoveredInDistrict})
              </button>
            </div>
          </div>

          {/* MapmyIndia Territory Boundary Map */}
          {showMap && activeMapQuery && (
            <div className="p-4 border-b border-border bg-secondary/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <MapIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">MapmyIndia Territory Boundary:</span>
                      <Badge variant="secondary" className="font-mono text-xs text-primary bg-primary/10 border-primary/20">
                        {activeMapQuery.type === 'district' ? `District: ${activeMapQuery.label}` : `Pincode: ${activeMapQuery.label}`}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Click any PIN card below to isolate that specific pincode polygon boundary.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeMapQuery.type === 'pincode' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs flex items-center gap-1.5"
                      onClick={() => setActiveMapQuery({ type: 'district', query: selectedDistrict.name, label: selectedDistrict.name })}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset to District
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowMap(false)}
                  >
                    Hide Map
                  </Button>
                </div>
              </div>

              <MapplsBoundaryMap 
                boundaryType={activeMapQuery.type}
                boundaryQuery={activeMapQuery.query}
                pincodes={pincodesMapData}
                selectedPincode={activeMapQuery.type === 'pincode' ? activeMapQuery.query : null}
                statusFilter={statusFilter}
                onPincodeClick={(pin) => {
                  setActiveMapQuery({ type: 'pincode', query: pin, label: pin });
                }}
                onResetSelection={() => {
                  setActiveMapQuery({ type: 'district', query: selectedDistrict.name, label: selectedDistrict.name });
                }}
                height="400px"
              />
            </div>
          )}

          {!showMap && (
            <div className="px-4 py-2 bg-secondary/10 border-b border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">MapmyIndia Boundary Map is collapsed.</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs flex items-center gap-1.5"
                onClick={() => setShowMap(true)}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Show Boundary Map
              </Button>
            </div>
          )}

          {/* Cards Grid */}
          <div className="p-4">
            {loadingOffices ? (
               <div className="p-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                 <Loader2 className="w-8 h-8 animate-spin" />
                 <span>Scanning territory data...</span>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPincodes.map(p => {
                  
                  // Find which agents are assigned to this pincode via zones
                  const assignedAgents = salespersons.filter(s => {
                    const agentZones = zones.filter(z => (s.assigned_zone_ids || []).includes(z.id!));
                    return agentZones.some(z => (z.pincodes || []).includes(p.pincode) || (z.pincodes || []).some(code => code.startsWith(p.pincode + ":")));
                  });

                  const isSelectedForMap = activeMapQuery?.type === 'pincode' && activeMapQuery.query === p.pincode;

                  // Clean display locality
                  const validAreas = p.areas.filter(a => a && !/^[.\-_/\s]+$/.test(a.trim()));
                  const displayAreas = validAreas.length > 0 
                    ? validAreas.slice(0, 3).join(", ")
                    : `${selectedDistrict.name} Hub Area`;

                  return (
                    <div 
                      key={p.pincode} 
                      onClick={() => {
                        setShowMap(true);
                        setActiveMapQuery({ type: 'pincode', query: p.pincode, label: p.pincode });
                      }}
                      className={`p-4 rounded-xl border flex flex-col transition-all cursor-pointer hover:shadow-md ${
                        isSelectedForMap ? 'ring-2 ring-primary shadow-sm ' : ''
                      }${
                        p.status === 'covered' ? 'bg-success/5 border-success/20 hover:border-success/40' : 
                        p.status === 'partial' ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40' : 
                        'bg-destructive/5 border-destructive/20 hover:border-destructive/40'
                      }`}
                    >
                      {/* Pincode and Status Badge */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${
                            p.status === 'covered' ? 'text-success' : 
                            p.status === 'partial' ? 'text-amber-500' : 
                            'text-destructive'
                          }`} />
                          <h4 className="font-mono font-bold text-foreground text-base">{p.pincode}</h4>
                        </div>
                        {p.status === 'covered' ? (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] uppercase font-semibold">Covered</Badge>
                        ) : p.status === 'partial' ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] uppercase font-semibold">Partial ({p.coveredAreas}/{p.totalAreas})</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] uppercase font-semibold">Uncovered</Badge>
                        )}
                      </div>
                      
                      {/* Clean Locality Text (No dots) */}
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1" title={displayAreas}>
                        {displayAreas}
                      </p>

                      {/* Assigned Agents or Unstaffed Warning */}
                      <div className="mt-auto pt-3 border-t border-border/50">
                        {assignedAgents.length > 0 ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                {assignedAgents.length} Agent{assignedAgents.length > 1 ? 's' : ''} Active
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAssignModalPincode(p.pincode);
                                }}
                                className="text-[10px] text-primary hover:underline font-semibold"
                              >
                                Manage
                              </button>
                            </div>
                            
                            {/* Explicit Agent Names & Phones */}
                            <div className="space-y-1">
                              {assignedAgents.slice(0, 2).map(agent => (
                                <div key={agent.id} className="flex items-center justify-between text-xs bg-muted/40 px-2 py-1 rounded-md">
                                  <span className="font-semibold text-foreground truncate max-w-[120px]">{agent.name}</span>
                                  <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5" />
                                    {agent.mobile_number}
                                  </span>
                                </div>
                              ))}
                              {assignedAgents.length > 2 && (
                                <span className="text-[10px] text-muted-foreground italic">+{assignedAgents.length - 2} more agents</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5 text-rose-500">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span className="text-xs font-semibold">Unstaffed Gap</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] px-2 font-semibold border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssignModalPincode(p.pincode);
                              }}
                            >
                              + Assign
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredPincodes.length === 0 && (
                  <div className="col-span-full p-12 text-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border">
                    No matching PINCODEs found for the selected filter.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Assign / Reassign Agent Modal */}
      {assignModalPincode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Manage Territory Staff</h3>
                  <p className="text-xs text-muted-foreground">Pincode {assignModalPincode} • {selectedDistrict?.name}</p>
                </div>
              </div>
              <button onClick={() => setAssignModalPincode(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Currently Assigned Agents */}
            <div className="space-y-4 mb-5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Currently Assigned Agents
                </label>
                {(() => {
                  const currentlyAssigned = salespersons.filter(s => {
                    const agentZones = zones.filter(z => (s.assigned_zone_ids || []).includes(z.id!));
                    return agentZones.some(z => (z.pincodes || []).includes(assignModalPincode) || (z.pincodes || []).some(code => code.startsWith(assignModalPincode + ":")));
                  });

                  if (currentlyAssigned.length === 0) {
                    return (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-lg font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        No agent currently deployed to this pincode.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {currentlyAssigned.map(agent => (
                        <div key={agent.id} className="flex items-center justify-between p-2.5 bg-muted/40 border border-border rounded-lg text-xs">
                          <div>
                            <div className="font-semibold text-foreground">{agent.name}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{agent.mobile_number}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                            onClick={() => handleUnassignAgent(agent.id!, assignModalPincode)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Assign New Agent */}
              <div className="pt-2 border-t border-border">
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Assign Another Salesperson
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary h-9"
                >
                  <option value="">-- Choose Salesperson --</option>
                  {salespersons.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.mobile_number}) {!s.is_active ? "[Inactive]" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="ghost" onClick={() => setAssignModalPincode(null)} disabled={isAssigning}>
                Close
              </Button>
              <Button 
                onClick={handleAssignAgentToPincode} 
                disabled={!selectedAgentId || isAssigning}
                className="bg-primary text-primary-foreground gap-1.5 font-semibold text-xs"
              >
                {isAssigning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Assign to Pincode
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
