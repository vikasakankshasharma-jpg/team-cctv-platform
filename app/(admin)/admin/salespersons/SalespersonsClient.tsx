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
  ChevronUp,
  Check,
  Pencil,
  X,
  Map as MapIcon,
  CircleDot,
  Hexagon
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { toast } from "sonner";
import type { Salesperson, CoverageZone } from "@/types";
import { TerritoryMatrix } from "./TerritoryMatrix";
import { computeDistrictPincodes, getPincodeCoordinates, calculateDistance, isPointInPolygon } from "@/lib/geo-utils";
import MapplsBoundaryMap from "@/components/MapplsBoundaryMap";
import { CoverageAreaMapEditor } from "@/components/admin/CoverageAreaMapEditor";
import type { QuadrantMapMarker } from "@/components/admin/CoverageMapCanvas";

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
  const inputRef = useRef<HTMLInputElement>(null);

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

  const toggleDropdown = () => {
    if (disabled || loading) return;
    setIsOpen(prev => {
      const next = !prev;
      if (next) {
        setFilterText("");
        setTimeout(() => inputRef.current?.focus(), 10);
      }
      return next;
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div 
        className="relative cursor-pointer"
        onClick={toggleDropdown}
      >
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          placeholder={loading ? "Loading..." : placeholder}
          value={isOpen ? filterText : (displayValue || "")}
          onChange={(e) => {
            setFilterText(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-8 cursor-pointer"
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
                onClick={(e) => {
                  e.stopPropagation();
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
  const [showZoneMap, setShowZoneMap] = useState(false);
  const [expandedPincodes, setExpandedPincodes] = useState<Set<string>>(new Set());
  const togglePincodeExpand = (pincode: string) => {
    setExpandedPincodes(prev => {
      const next = new Set(prev);
      if (next.has(pincode)) next.delete(pincode);
      else next.add(pincode);
      return next;
    });
  };
  const [modalMapQuery, setModalMapQuery] = useState<{ type: 'district' | 'pincode'; query: string } | null>(null);
  const [zoneDefinitionMode, setZoneDefinitionMode] = useState<"pincodes" | "radius" | "polygon" | "hybrid">("hybrid");
  const [mapToolMode, setMapToolMode] = useState<"radius" | "polygon">("radius");
  const [showCoverageMap, setShowCoverageMap] = useState<boolean>(true);
  const [newZone, setNewZone] = useState<Partial<CoverageZone>>({
    pincodes: [],
    radius_km: 15,
    center_coordinates: { lat: 26.9124, lng: 75.7873 },
    polygon_coordinates: []
  });

  // Geographic Hierarchy State (State -> District -> Tehsil -> Pincodes)
  const [geoStates, setGeoStates] = useState<{ label: string; value: string }[]>([]);
  const [selectedState, setSelectedState] = useState<{ name: string; slug: string } | null>(null);
  const [geoDistricts, setGeoDistricts] = useState<{ label: string; value: string }[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<{ name: string; slug: string } | null>(null);
  
  // Tehsils State
  const [geoTehsils, setGeoTehsils] = useState<{ label: string; value: string; pincodes: string[] }[]>([]);
  const [selectedTehsil, setSelectedTehsil] = useState<string>("all");
  const [loadingTehsils, setLoadingTehsils] = useState(false);

  const [districtOffices, setDistrictOffices] = useState<any[]>([]);
  const [availablePincodes, setAvailablePincodes] = useState<{ pincode: string; areas: string[]; quadrants?: any[]; lat?: number; lng?: number; radius?: number }[]>([]);

  const [zonePincodeSearch, setZonePincodeSearch] = useState("");
  
  const filteredAvailablePincodes = useMemo(() => {
    let result = availablePincodes;
    if (selectedTehsil && selectedTehsil !== "all") {
      const tehsilData = geoTehsils.find(t => t.value === selectedTehsil);
      if (tehsilData) {
        result = result.filter(p => tehsilData.pincodes.includes(p.pincode));
      }
    }
    if (zonePincodeSearch.trim()) {
      const q = zonePincodeSearch.toLowerCase();
      result = result.filter(p => 
        p.pincode.includes(q) || 
        (p.areas || []).some((a: string) => a.toLowerCase().includes(q))
      );
    }
    return result;
  }, [availablePincodes, zonePincodeSearch, selectedTehsil, geoTehsils]);

  // Quadrant micro-zone map markers (Red for uncovered, Green for covered)
  const quadrantMapMarkers = useMemo<QuadrantMapMarker[]>(() => {
    const markers: QuadrantMapMarker[] = [];
    const selectedSet = new Set(newZone.pincodes || []);

    filteredAvailablePincodes.forEach(p => {
      const baseCoords = (p.lat && p.lng) ? { lat: p.lat, lng: p.lng } : getPincodeCoordinates(p.pincode);
      if (!baseCoords) return;

      const isParentSelected = selectedSet.has(p.pincode);
      const hasQuadrants = p.quadrants && p.quadrants.length > 0;

      if (hasQuadrants) {
        p.quadrants!.forEach((q: any) => {
          const zoneName = q.zone || "Central";
          const tag = `${p.pincode}:${zoneName}`;
          const isQuadSelected = isParentSelected || selectedSet.has(tag);

          let dLat = 0;
          let dLng = 0;
          const zLower = zoneName.toLowerCase();
          if (zLower.includes("north")) dLat += 0.012;
          if (zLower.includes("south")) dLat -= 0.012;
          if (zLower.includes("east")) dLng += 0.012;
          if (zLower.includes("west")) dLng -= 0.012;

          markers.push({
            id: tag,
            pincode: p.pincode,
            quadrantName: zoneName,
            areaName: q.anchor || q.coverage || (p.areas && p.areas[0]) || p.pincode,
            lat: baseCoords.lat + dLat,
            lng: baseCoords.lng + dLng,
            isSelected: isQuadSelected
          });
        });
      } else {
        markers.push({
          id: p.pincode,
          pincode: p.pincode,
          areaName: (p.areas || []).join(", ") || p.pincode,
          lat: baseCoords.lat,
          lng: baseCoords.lng,
          isSelected: isParentSelected
        });
      }
    });

    return markers;
  }, [filteredAvailablePincodes, newZone.pincodes]);

  // Toggle quadrant circle on the map between Red (uncovered) and Green (covered)
  const handleToggleQuadrantMarker = (id: string, currentlySelected: boolean) => {
    setNewZone(prev => {
      const current = new Set(prev.pincodes || []);
      if (id.includes(":")) {
        const [pin] = id.split(":");
        if (currentlySelected) {
          // If parent pincode was selected, break it down to the remaining 3 quadrants
          if (current.has(pin)) {
            current.delete(pin);
            const pData = availablePincodes.find(p => p.pincode === pin);
            if (pData?.quadrants) {
              pData.quadrants.forEach(q => {
                const qTag = `${pin}:${q.zone}`;
                if (qTag !== id) current.add(qTag);
              });
            }
          } else {
            current.delete(id);
          }
        } else {
          // Was uncovered (Red) -> now covered (Green)
          current.add(id);
          // If all 4 quadrants for this pincode are now covered, consolidate into parent
          const pData = availablePincodes.find(p => p.pincode === pin);
          if (pData?.quadrants && pData.quadrants.length === 4) {
            const all4Selected = pData.quadrants.every(q => current.has(`${pin}:${q.zone}`));
            if (all4Selected) {
              pData.quadrants.forEach(q => current.delete(`${pin}:${q.zone}`));
              current.add(pin);
            }
          }
        }
      } else {
        // Base pincode
        if (currentlySelected) {
          current.delete(id);
          Array.from(current).forEach(item => {
            if (item.startsWith(`${id}:`)) current.delete(item);
          });
        } else {
          Array.from(current).forEach(item => {
            if (item.startsWith(`${id}:`)) current.delete(item);
          });
          current.add(id);
        }
      }

      return { ...prev, pincodes: Array.from(current) };
    });
  };

  // Smart Sync: Auto-select PINs and quadrants inside current map radius or polygon
  const handleAutoSelectInsideMap = () => {
    if (mapToolMode === "radius") {
      if (!newZone.center_coordinates?.lat || !newZone.radius_km) {
        toast.error("Center coordinates and radius are required");
        return;
      }
      const center = newZone.center_coordinates;
      const radiusKm = newZone.radius_km;

      const insideIds: string[] = [];
      quadrantMapMarkers.forEach(m => {
        const dist = calculateDistance(center, { lat: m.lat, lng: m.lng });
        if (dist <= radiusKm) {
          insideIds.push(m.id);
        }
      });

      if (insideIds.length === 0) {
        toast.info("No PINs or Quadrants fall within the current radius circle");
        return;
      }

      setNewZone(prev => ({
        ...prev,
        pincodes: Array.from(new Set([...(prev.pincodes || []), ...insideIds]))
      }));
      toast.success(`Auto-selected ${insideIds.length} micro-zones within ${radiusKm}km radius!`);
    } else {
      const poly = newZone.polygon_coordinates || [];
      if (poly.length < 3) {
        toast.error("Please add at least 3 polygon boundary points first");
        return;
      }

      const insideIds: string[] = [];
      quadrantMapMarkers.forEach(m => {
        if (isPointInPolygon({ lat: m.lat, lng: m.lng }, poly)) {
          insideIds.push(m.id);
        }
      });

      if (insideIds.length === 0) {
        toast.info("No PINs or Quadrants fall within the current polygon perimeter");
        return;
      }

      setNewZone(prev => ({
        ...prev,
        pincodes: Array.from(new Set([...(prev.pincodes || []), ...insideIds]))
      }));
      toast.success(`Auto-selected ${insideIds.length} micro-zones inside polygon perimeter!`);
    }
  };

  // Smart Sync: Fit Map Radius / Polygon around all currently selected PINs
  const handleFitMapToSelectedPins = () => {
    const selectedMarkers = quadrantMapMarkers.filter(m => m.isSelected);
    if (selectedMarkers.length === 0) {
      toast.error("Please select at least one PINCODE or Quadrant first");
      return;
    }

    const sumLat = selectedMarkers.reduce((acc, m) => acc + m.lat, 0);
    const sumLng = selectedMarkers.reduce((acc, m) => acc + m.lng, 0);
    const centerLat = sumLat / selectedMarkers.length;
    const centerLng = sumLng / selectedMarkers.length;
    const newCenter = { lat: centerLat, lng: centerLng };

    let maxDistKm = 0;
    selectedMarkers.forEach(m => {
      const dist = calculateDistance(newCenter, { lat: m.lat, lng: m.lng });
      if (dist > maxDistKm) maxDistKm = dist;
    });

    const enclosingRadiusKm = Math.max(5, Math.ceil(maxDistKm + 2));

    if (mapToolMode === "radius") {
      setNewZone(prev => ({
        ...prev,
        center_coordinates: newCenter,
        radius_km: enclosingRadiusKm
      }));
      toast.success(`Map radius fitted to ${enclosingRadiusKm}km around ${selectedMarkers.length} selected areas`);
    } else {
      const minLat = Math.min(...selectedMarkers.map(m => m.lat)) - 0.015;
      const maxLat = Math.max(...selectedMarkers.map(m => m.lat)) + 0.015;
      const minLng = Math.min(...selectedMarkers.map(m => m.lng)) - 0.015;
      const maxLng = Math.max(...selectedMarkers.map(m => m.lng)) + 0.015;

      const boundingPoly = [
        { lat: maxLat, lng: minLng },
        { lat: maxLat, lng: maxLng },
        { lat: minLat, lng: maxLng },
        { lat: minLat, lng: minLng },
      ];

      setNewZone(prev => ({
        ...prev,
        center_coordinates: newCenter,
        polygon_coordinates: boundingPoly
      }));
      toast.success(`Map polygon perimeter fitted around ${selectedMarkers.length} selected areas`);
    }
  };

  // Gap Filler: Claim all remaining uncovered (Red) quadrants
  const handleClaimAllUncovered = () => {
    const uncoveredIds = quadrantMapMarkers.filter(m => !m.isSelected).map(m => m.id);
    if (uncoveredIds.length === 0) {
      toast.info("All areas in this list are already covered!");
      return;
    }

    setNewZone(prev => ({
      ...prev,
      pincodes: Array.from(new Set([...(prev.pincodes || []), ...uncoveredIds]))
    }));
    toast.success(`Claimed ${uncoveredIds.length} uncovered micro-zones! All are now covered.`);
  };

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [generatingPins, setGeneratingPins] = useState<Set<string>>(new Set());

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
    setSelectedTehsil("all");
    setGeoTehsils([]);
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
  
  const handleGenerateQuadrants = async (e: React.MouseEvent, pin: string) => {
    e.preventDefault();
    e.stopPropagation();
    setGeneratingPins(prev => new Set(prev).add(pin));
    try {
      const res = await fetch(`/api/pincode/${pin}`);
      if (res.ok) {
        const data = await res.json();
        if (data.quadrants && data.quadrants.length > 0) {
          // Immediately update availablePincodes in local state so UI reflects it instantly
          setAvailablePincodes(prev => prev.map(p => {
            if (p.pincode === pin) {
              return { ...p, quadrants: data.quadrants };
            }
            return p;
          }));
          setDistrictOffices(prev => prev.map(o => {
            if (o.pincode === pin) {
              return { ...o, quadrants: data.quadrants };
            }
            return o;
          }));
          toast.success(`Generated quadrants for ${pin}`);
        }
        if (selectedState && selectedDistrict) {
          await handleSelectDistrict(selectedDistrict.slug, selectedDistrict.name, true);
        }
      }
    } catch(err) {
      console.error(err);
    } finally {
      setGeneratingPins(prev => {
        const next = new Set(prev);
        next.delete(pin);
        return next;
      });
    }
  };


  const handleGenerateAllQuadrants = async () => {
    let targetPins: string[] = [];
    if (newZone.pincodes && newZone.pincodes.length > 0) {
      const selectedBasePins = Array.from(new Set(newZone.pincodes.map(p => p.split(':')[0])));
      targetPins = filteredAvailablePincodes
        .filter(p => selectedBasePins.includes(p.pincode) && (!p.quadrants || p.quadrants.length === 0))
        .map(p => p.pincode);
    } else {
      targetPins = filteredAvailablePincodes
        .filter(p => !p.quadrants || p.quadrants.length === 0)
        .map(p => p.pincode);
    }

    if (targetPins.length === 0) {
      toast.success("Target pincodes already have quadrants generated!");
      return;
    }
    
    toast.loading(`Generating quadrants for ${targetPins.length} pincodes... This may take up to ${Math.ceil(targetPins.length * 4.5 / 60)} minutes.`, { id: "genAll" });
    
    // Process sequentially to stay strictly under Gemini 15 RPM free tier limit
    const batchSize = 1;
    for (let i = 0; i < targetPins.length; i += batchSize) {
      const batch = targetPins.slice(i, i + batchSize);
      
      batch.forEach(pin => setGeneratingPins(prev => new Set(prev).add(pin)));
      
      await Promise.all(batch.map(async (pin) => {
        try {
          const res = await fetch(`/api/pincode/${pin}`);
          if (res.ok) {
            const data = await res.json();
            if (data.quadrants && data.quadrants.length > 0) {
              setAvailablePincodes(prev => prev.map(p => {
                if (p.pincode === pin) {
                  return { ...p, quadrants: data.quadrants };
                }
                return p;
              }));
              setDistrictOffices(prev => prev.map(o => {
                if (o.pincode === pin) {
                  return { ...o, quadrants: data.quadrants };
                }
                return o;
              }));
            }
          }
        } catch (err) {
          console.error("Failed to generate for pin", pin, err);
        } finally {
          setGeneratingPins(prev => {
            const next = new Set(prev);
            next.delete(pin);
            return next;
          });
        }
      }));
      
      // Wait 4.5 seconds between requests to avoid 429 Too Many Requests (15 RPM limit)
      if (i + batchSize < targetPins.length) {
        await new Promise(r => setTimeout(r, 4500));
      }
    }
    
    toast.success("Finished generating quadrants!", { id: "genAll" });
    if (selectedState && selectedDistrict) {
      await handleSelectDistrict(selectedDistrict.slug, selectedDistrict.name, true);
    }
  };

  const handleSelectDistrict = (slug: string, name: string, forceRefresh = false) => {
    if (!selectedState) return;
    setSelectedDistrict({ name, slug });
    setModalMapQuery({ type: 'district', query: name });
    setSelectedTehsil("all");
    setGeoTehsils([]);
    setLoadingOffices(true);
    setLoadingTehsils(true);

    fetch(`/api/admin/geo?type=offices&state=${selectedState.slug}&district=${slug}&_t=${Date.now()}${forceRefresh ? '&refresh=true' : ''}`)
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

        // Group Pincodes
        const grouped = computePincodesFromOffices(offices);
        setAvailablePincodes(grouped);

        // Derive coordinates to center map on the selected district
        let districtCenter: { lat: number; lng: number } | undefined;
        if (grouped.length > 0 && grouped[0].pincode) {
          const coords = getPincodeCoordinates(grouped[0].pincode);
          if (coords) districtCenter = coords;
        }

        // Auto suggest zone name if empty, and sync city, state, center_coordinates
        setNewZone(prev => ({
          ...prev,
          name: prev.name || `${name}, ${selectedState.name}`,
          city: name,
          state: selectedState.name,
          ...(districtCenter ? { center_coordinates: districtCenter } : {})
        }));

        toast.success(`Loaded ${grouped.length} pincodes in ${name}`);

        // Fetch Tehsils in background
        fetch(`/api/admin/geo/tehsils?state=${selectedState.slug}&district=${slug}`)
          .then(res => res.json())
          .then(tehsilData => {
            if (tehsilData && !tehsilData.error) {
              const tehsilOpts = [
                { label: `All Tehsils in ${name}`, value: "all", pincodes: [] },
                ...Object.keys(tehsilData).map(tName => ({
                  label: `${tName} (${tehsilData[tName].length} PINs)`,
                  value: tName,
                  pincodes: tehsilData[tName]
                }))
              ];
              setGeoTehsils(tehsilOpts);
            }
          })
          .catch(e => console.error("Failed to load tehsils", e))
          .finally(() => setLoadingTehsils(false));

      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load district pincodes");
        setLoadingTehsils(false);
      })
      .finally(() => setLoadingOffices(false));
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
    if (!newZone.name?.trim()) {
      toast.error("Zone name is required");
      return;
    }

    const hasPincodes = Boolean(newZone.pincodes && newZone.pincodes.length > 0);
    const hasRadius = Boolean(mapToolMode === "radius" && newZone.center_coordinates?.lat && newZone.radius_km);
    const hasPolygon = Boolean(mapToolMode === "polygon" && newZone.polygon_coordinates && newZone.polygon_coordinates.length >= 3);

    if (!hasPincodes && !hasRadius && !hasPolygon) {
      toast.error("Please configure at least one coverage boundary: select PINCODEs/Quadrants or set a Map area");
      return;
    }

    let finalCoverageType: "pincodes" | "radius" | "polygon" | "hybrid" = "pincodes";
    if (hasPincodes && (hasRadius || hasPolygon)) {
      finalCoverageType = "hybrid";
    } else if (hasRadius) {
      finalCoverageType = "radius";
    } else if (hasPolygon) {
      finalCoverageType = "polygon";
    } else {
      finalCoverageType = "pincodes";
    }

    setIsSaving(true);
    try {
      const enrichedPincodesData = (newZone.pincodes || [])
        .map(pin => availablePincodes.find(p => p.pincode === pin))
        .filter(Boolean);
        
      const payload: CoverageZone = {
        name: newZone.name?.trim() || "",
        city: newZone.city || selectedDistrict?.name || "Jaipur",
        state: newZone.state || selectedState?.name || "Rajasthan",
        pincodes: newZone.pincodes || [],
        pincodes_data: enrichedPincodesData,
        is_active: newZone.is_active ?? true,
        coverage_type: finalCoverageType,
        center_coordinates: newZone.center_coordinates,
        radius_km: newZone.radius_km || 15,
        polygon_coordinates: newZone.polygon_coordinates || [],
        center_address_text: newZone.center_address_text,
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
              onClick={() => { 
                setNewZone({ 
                  pincodes: [],
                  radius_km: 15,
                  center_coordinates: { lat: 26.9124, lng: 75.7873 },
                  polygon_coordinates: []
                }); 
                setMapToolMode("radius");
                setShowCoverageMap(true);
                setShowAddZone(true); 
              }}
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
            {filteredZones.map(z => {
              const isPoly = z.coverage_type === "polygon" || (z.polygon_coordinates && z.polygon_coordinates.length >= 3);
              const isHybrid = z.coverage_type === "hybrid" || (Boolean(z.pincodes?.length) && (Boolean(z.radius_km) || (z.polygon_coordinates && z.polygon_coordinates.length >= 3)));
              const zoneMode = z.coverage_type || (z.radius_km ? "radius" : (isPoly ? "polygon" : "pincodes"));
              return (
              <Card 
                key={z.id} 
                className="p-4 rounded-xl flex items-center justify-between group border-border shadow-sm bg-card cursor-pointer hover:bg-secondary/20 transition-all" 
                onClick={() => { 
                  setNewZone(z); 
                  setMapToolMode(isPoly ? "polygon" : "radius");
                  setShowCoverageMap(true);
                  setShowAddZone(true); 
                }}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h5 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
                      {z.name}
                      <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                        {salespersons.filter(s => (s.assigned_zone_ids || []).includes(z.id!)).length} Agents
                      </span>
                    </h5>
                    {isHybrid ? (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-indigo-500/10 text-indigo-600 border-indigo-500/30 gap-1 font-semibold">
                        ⚡ Hybrid ({z.pincodes?.length || 0} PINs + Map)
                      </Badge>
                    ) : zoneMode === "radius" ? (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1 font-semibold">
                        🎯 {z.radius_km || 15} km Radius
                      </Badge>
                    ) : zoneMode === "polygon" ? (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1 font-semibold">
                        🔷 Polygon ({z.polygon_coordinates?.length || 0} pts)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 font-semibold">
                        📮 {z.pincodes?.length || 0} PINs
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mt-1 truncate max-w-full" title={zoneMode === "radius" ? (z.center_address_text || `${z.radius_km} km radius`) : (z.pincodes?.join(", ") || "")}>
                    {isHybrid
                      ? `${z.pincodes?.length || 0} PINs · ${z.polygon_coordinates && z.polygon_coordinates.length >= 3 ? `${z.polygon_coordinates.length} pts polygon` : `${z.radius_km || 15} km radius`}`
                      : zoneMode === "radius" 
                      ? (z.center_address_text ? `Centered: ${z.center_address_text}` : `Center: ${z.center_coordinates?.lat.toFixed(3) || "26.912"}, ${z.center_coordinates?.lng.toFixed(3) || "75.787"} (${z.radius_km || 15} km)`)
                      : zoneMode === "polygon"
                      ? `${z.polygon_coordinates?.length || 0} boundary points defined`
                      : (z.pincodes?.join(", ") || "No pincodes assigned")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setNewZone(z); 
                      setMapToolMode(isPoly ? "polygon" : "radius");
                      setShowCoverageMap(true);
                      setShowAddZone(true); 
                    }}
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
              );
            })}
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
          <div className="relative bg-card w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 pb-4 border-b border-border flex items-center justify-between shrink-0 bg-card">
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight mb-0.5">{newZone.id ? "Update Coverage Zone" : "Define Coverage Zone"}</h2>
                <p className="text-xs text-muted-foreground">
                  Select State, District, and Tehsil to view and map all official PINCODEs with single-click Select All.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => { setShowAddZone(false); setNewZone({ pincodes: [] }); }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Zone Name</label>
                <Input 
                  type="text" 
                  value={newZone.name || ""} 
                  onChange={e => setNewZone(prev => ({...prev, name: e.target.value}))}
                  placeholder="e.g. Jaipur, Rajasthan"
                />
              </div>

              {/* 3-Tier Cascading Geographic Dropdowns with real-time text filter — ALWAYS VISIBLE */}
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

              {/* 3. Tehsil Filter (AI Powered) */}
              {selectedDistrict && (
                <div className="animate-in fade-in duration-200">
                  <SearchableDropdown
                    label="3. Select Tehsil (AI Powered)"
                    placeholder={loadingTehsils ? "AI is analyzing PINCODEs..." : "Select Tehsil..."}
                    value={selectedTehsil}
                    displayValue={selectedTehsil === "all" ? `All Tehsils in ${selectedDistrict.name}` : geoTehsils.find(t => t.value === selectedTehsil)?.label || selectedTehsil}
                    options={geoTehsils}
                    onSelect={(val) => setSelectedTehsil(val)}
                    disabled={loadingTehsils}
                    loading={loadingTehsils}
                  />
                </div>
              )}

              {/* Strategy 1: Interactive Map Polygon & Radius Tool */}
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/60 p-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      Map Polygon & Radius Tool
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                      Visual Geo-Fence
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg bg-secondary/60 p-0.5 border border-border text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setMapToolMode("radius");
                          setShowCoverageMap(true);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          mapToolMode === "radius"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <CircleDot className="w-3.5 h-3.5" />
                        <span>Radius Tool ({newZone.radius_km || 15}km)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMapToolMode("polygon");
                          setShowCoverageMap(true);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          mapToolMode === "polygon"
                            ? "bg-purple-600 text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Hexagon className="w-3.5 h-3.5" />
                        <span>Polygon Tool ({(newZone.polygon_coordinates || []).length} pts)</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCoverageMap(prev => !prev)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition-all flex items-center gap-1"
                      title={showCoverageMap ? "Collapse map to save space" : "Expand interactive map"}
                    >
                      {showCoverageMap ? "Collapse Map" : "Expand Map"}
                    </button>
                  </div>
                </div>

                {showCoverageMap && (
                  <div className="animate-in fade-in duration-200 mt-1">
                    <CoverageAreaMapEditor
                      mode={mapToolMode}
                      onModeChange={(m) => setMapToolMode(m)}
                      center={newZone.center_coordinates || { lat: 26.9124, lng: 75.7873 }}
                      onCenterChange={(centerCoords, addrText) => {
                        setNewZone(prev => ({
                          ...prev,
                          center_coordinates: centerCoords,
                          center_address_text: addrText || prev.center_address_text
                        }));
                      }}
                      radiusKm={newZone.radius_km || 15}
                      onRadiusKmChange={(r) => {
                        setNewZone(prev => ({ ...prev, radius_km: r }));
                      }}
                      polygonPoints={newZone.polygon_coordinates || []}
                      onPolygonPointsChange={(pts) => {
                        setNewZone(prev => ({ ...prev, polygon_coordinates: pts }));
                      }}
                      height="340px"
                      allowModeSwitch={true}
                      quadrantMarkers={quadrantMapMarkers}
                      onToggleQuadrantMarker={handleToggleQuadrantMarker}
                      onAutoSelectInsideMap={handleAutoSelectInsideMap}
                      onFitMapToSelectedPins={handleFitMapToSelectedPins}
                      onClaimAllUncovered={handleClaimAllUncovered}
                    />
                  </div>
                )}
              </div>

              {/* Strategy 2: 4-Quadrant & PINCODE Matrix */}
              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Available PINCODEs {availablePincodes.length > 0 && `(${filteredAvailablePincodes.length !== availablePincodes.length ? `${filteredAvailablePincodes.length} of ${availablePincodes.length}` : availablePincodes.length} Found)`}
                    </label>
                  </div>
                  {availablePincodes.length > 0 && (
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={handleGenerateAllQuadrants}
                        className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                      >
                          ✨ Gen Quadrants {(newZone.pincodes && newZone.pincodes.length > 0) ? "(Selected)" : "(All)"}
                        </button>
                      <span className="text-muted-foreground text-xs">•</span>
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
                      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-2">
                        {filteredAvailablePincodes.length === 0 ? (
                          <div className="text-center p-4 text-xs text-muted-foreground italic">
                            No matching PINCODEs found for "{zonePincodeSearch}".
                          </div>
                        ) : filteredAvailablePincodes.map(p => {
                          const isParentSelected = (newZone.pincodes || []).includes(p.pincode);
                          const hasQuadrants = p.quadrants && p.quadrants.length > 0;
                          const hasAreas = p.areas && p.areas.length > 0;
                          const isExpanded = expandedPincodes.has(p.pincode);
                          const selectedSubCount = (newZone.pincodes || []).filter(code => code.startsWith(p.pincode + ':')).length;

                          return (
                            <div key={p.pincode} className="flex flex-col gap-1 mb-2 bg-white rounded-xl border p-1 shadow-sm transition-all">
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
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold tracking-wide">ALL OF {p.pincode}</span>
                                        {isParentSelected ? (
                                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-bold rounded flex items-center gap-1 border border-emerald-300/60">
                                            ✓ Fully Covered
                                          </span>
                                        ) : selectedSubCount > 0 ? (
                                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold rounded">
                                            {selectedSubCount} of {p.quadrants?.length || 4} Covered
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 text-[10px] font-bold rounded flex items-center gap-1 border border-rose-300/60">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Uncovered
                                          </span>
                                        )}
                                      </div>
                                      {hasQuadrants ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            togglePincodeExpand(p.pincode);
                                          }}
                                          className="ml-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded transition-colors flex items-center gap-1"
                                        >
                                          {isExpanded ? (
                                            <>Hide {p.quadrants!.length} Quadrants <ChevronUp className="w-3 h-3" /></>
                                          ) : (
                                            <>View {p.quadrants!.length} Quadrants <ChevronDown className="w-3 h-3" /></>
                                          )}
                                        </button>
                                      ) : hasAreas ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            togglePincodeExpand(p.pincode);
                                          }}
                                          className="ml-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium rounded transition-colors flex items-center gap-1"
                                        >
                                          {isExpanded ? (
                                            <>Hide {p.areas.length} Areas <ChevronUp className="w-3 h-3" /></>
                                          ) : (
                                            <>View {p.areas.length} Areas <ChevronDown className="w-3 h-3" /></>
                                          )}
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={(e) => handleGenerateQuadrants(e, p.pincode)}
                                          disabled={generatingPins.has(p.pincode)}
                                          className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded hover:bg-indigo-100 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {generatingPins.has(p.pincode) ? <Loader2 className="w-3 h-3 animate-spin" /> : "✨"} Gen Quadrants
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              </div>

                              {hasQuadrants && isExpanded && (
                                <div className="pl-7 pr-2 pb-2 flex flex-col gap-1 border-t pt-2 mt-1">
                                  {p.quadrants!.map((q: any) => {
                                    const areaCode = `${p.pincode}:${q.zone}`;
                                    const isSelected = isParentSelected || (newZone.pincodes || []).includes(areaCode);
                                    
                                    return (
                                      <label key={areaCode} className={`flex items-start gap-2 p-1.5 rounded-md cursor-pointer transition-all border ${
                                        isSelected 
                                          ? 'bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-medium border-emerald-500/20' 
                                          : 'hover:bg-muted/40 text-muted-foreground border-transparent'
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
                                          className="mt-0.5 rounded border-input text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 disabled:opacity-50" 
                                        />
                                        <div className="flex flex-col flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-semibold leading-tight">{q.zone} <span className="opacity-70 font-normal">({q.anchor})</span></span>
                                            {isSelected ? (
                                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/90 dark:text-emerald-300 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded border border-emerald-300/60">
                                                ✓ Covered
                                              </span>
                                            ) : (
                                              <span className="text-[9px] font-bold text-rose-700 bg-rose-100/90 dark:text-rose-300 dark:bg-rose-900/40 px-1.5 py-0.5 rounded border border-rose-300/60 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Uncovered
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[9px] opacity-60 leading-tight mt-0.5">{q.coverage}</span>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}

                              {hasAreas && !hasQuadrants && isExpanded && (
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
                          boundaryType={newZone.pincodes && newZone.pincodes.length > 0 ? "zone" : (modalMapQuery?.type || 'district')}
                          boundaryQuery={modalMapQuery?.query || selectedDistrict?.name || ""}
                          boundaryData={newZone.pincodes}
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
              </div>

              {/* Sticky Footer */}
              <div className="p-4 border-t border-border bg-card/95 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {mapToolMode === "radius" && newZone.center_coordinates?.lat ? (
                    <Badge variant="secondary" className="font-semibold text-blue-600 px-2.5 py-1 text-xs bg-blue-500/10 border-blue-500/30">
                      🎯 {newZone.radius_km || 15} km Radius
                    </Badge>
                  ) : null}
                  {mapToolMode === "polygon" && (newZone.polygon_coordinates || []).length >= 3 ? (
                    <Badge variant="secondary" className="font-semibold text-purple-600 px-2.5 py-1 text-xs bg-purple-500/10 border-purple-500/30">
                      🔷 {(newZone.polygon_coordinates || []).length} Pts Polygon
                    </Badge>
                  ) : null}
                  <Badge variant="secondary" className="font-semibold text-primary px-2.5 py-1 text-xs">
                    📮 {(newZone.pincodes || []).length} PINs/Quadrants
                  </Badge>
                  {((newZone.pincodes || []).length > 0 && ((mapToolMode === "radius" && !!newZone.center_coordinates?.lat) || (mapToolMode === "polygon" && (newZone.polygon_coordinates || []).length >= 3))) && (
                    <Badge variant="outline" className="font-bold text-emerald-600 px-2 py-0.5 text-[11px] bg-emerald-500/10 border-emerald-500/30">
                      ⚡ Hybrid Strategy Active
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2.5">
                  <button 
                    type="button"
                    onClick={() => { setShowAddZone(false); setNewZone({ pincodes: [] }); }}
                    className="px-5 py-2.5 bg-secondary text-secondary-foreground font-semibold text-sm rounded-xl hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleAddZone}
                    disabled={
                      isSaving || 
                      !newZone.name?.trim() || 
                      ((!newZone.pincodes || newZone.pincodes.length === 0) &&
                       (!newZone.center_coordinates?.lat || !newZone.radius_km) &&
                       (!newZone.polygon_coordinates || newZone.polygon_coordinates.length < 3))
                    }
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} {newZone.id ? "Update Zone" : "Establish Zone"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


