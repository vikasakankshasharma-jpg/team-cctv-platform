"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Layers, 
  Search, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Loader2, 
  Edit3,
  CheckCircle2,
  Building
} from "lucide-react";
import { 
  BASELINE_GEO_HIERARCHY, 
  PIN_METADATA_INDEX, 
  resolveStaticHierarchy 
} from "@/lib/geo/geoHierarchy";
import { JAIPUR_VERIFIED_QUADRANTS } from "@/lib/geo/jaipurQuadrants";

export interface TerritoryPincodeSelectorProps {
  selectedPincodes: string[];
  onChange: (pincodes: string[]) => void;
  required?: boolean;
  label?: string;
  helperText?: string;
}

interface DropdownOption {
  label: string;
  value: string;
  sublabel?: string;
}

interface PincodeDetail {
  pincode: string;
  name: string;
  tehsil: string;
  district: string;
  state: string;
  areas?: string[];
}

/**
 * Reusable Searchable Dropdown for State, District & Tehsil
 */
function SearchableDropdown({
  label,
  placeholder,
  value,
  options,
  loading = false,
  disabled = false,
  onChange,
  icon: Icon = MapPin,
}: {
  label: string;
  placeholder: string;
  value?: string;
  options: DropdownOption[];
  loading?: boolean;
  disabled?: boolean;
  onChange: (opt: DropdownOption) => void;
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
    const q = search.toLowerCase();
    return options.filter(o => 
      o.label.toLowerCase().includes(q) || 
      (o.sublabel && o.sublabel.toLowerCase().includes(q)) ||
      o.value.toLowerCase().includes(q)
    );
  }, [options, search]);

  const selectedItem = options.find(o => o.value === value || o.label === value);

  return (
    <div className="relative flex-1 min-w-[160px]" ref={dropdownRef}>
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
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[240px] max-w-[340px] bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
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
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-lg transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-secondary/60"
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{item.label}</span>
                      {item.sublabel && (
                        <span className="text-[10px] text-muted-foreground truncate">{item.sublabel}</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
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

/**
 * 4-Tier Territory Cascader: State -> District -> Tehsil -> PINCODEs
 */
export function TerritoryPincodeSelector({
  selectedPincodes,
  onChange,
  required = false,
  label = "Serviceable Territory & PIN Codes",
  helperText = "Select State, District, and Tehsil to choose PINCODEs, or toggle manual paste."
}: TerritoryPincodeSelectorProps) {
  // Cascader State
  const [geoStates, setGeoStates] = useState<DropdownOption[]>([]);
  const [selectedState, setSelectedState] = useState<DropdownOption | null>(null);
  const [loadingStates, setLoadingStates] = useState(false);

  const [geoDistricts, setGeoDistricts] = useState<DropdownOption[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DropdownOption | null>(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [geoTehsils, setGeoTehsils] = useState<{ label: string; value: string; pincodes: string[] }[]>([]);
  const [selectedTehsil, setSelectedTehsil] = useState<string>("all");
  const [loadingTehsils, setLoadingTehsils] = useState(false);

  // Available Pincodes for current district/state
  const [districtPins, setDistrictPins] = useState<PincodeDetail[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(false);

  // Filter & Search inside Pincode grid
  const [pinFilterSearch, setPinFilterSearch] = useState("");

  // Manual Paste Fallback Toggle
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [manualText, setManualText] = useState("");

  // Sync manualText when selectedPincodes changes externally
  useEffect(() => {
    setManualText(selectedPincodes.join(", "));
  }, [selectedPincodes]);

  // ── 1. Load States ──
  useEffect(() => {
    setLoadingStates(true);
    fetch(`/api/admin/geo?type=states&_t=${Date.now()}`)
      .then(async r => {
        if (!r.ok) throw new Error("States error");
        const data = await r.json();
        if (data.error || !Array.isArray(data)) throw new Error(data.error || "Invalid format");
        return data;
      })
      .catch(() => {
        // Fallback to baseline hierarchy
        return BASELINE_GEO_HIERARCHY.map(s => ({
          name: s.name,
          slug: s.name.toLowerCase()
        }));
      })
      .then(data => {
        if (Array.isArray(data)) {
          const sorted = data
            .map((s: any) => ({ label: s.name, value: s.slug }))
            .sort((a, b) => a.label.localeCompare(b.label));
          setGeoStates(sorted);

          // Default to Rajasthan
          const rajasthan = sorted.find((s: any) => s.label.toLowerCase() === "rajasthan");
          if (rajasthan) {
            setSelectedState(rajasthan);
          } else if (sorted.length > 0) {
            setSelectedState(sorted[0]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingStates(false));
  }, []);

  // ── 2. Load Districts ──
  useEffect(() => {
    if (!selectedState) {
      setGeoDistricts([]);
      setSelectedDistrict(null);
      setGeoTehsils([]);
      setSelectedTehsil("all");
      setDistrictPins([]);
      return;
    }

    setLoadingDistricts(true);
    fetch(`/api/admin/geo?type=districts&state=${selectedState.value}&_t=${Date.now()}`)
      .then(async r => {
        if (!r.ok) throw new Error("Districts error");
        const data = await r.json();
        if (data.error || !data.districts || !Array.isArray(data.districts)) throw new Error("Invalid format");
        return data.districts;
      })
      .catch(() => {
        // Fallback to baseline
        const stateDef = BASELINE_GEO_HIERARCHY.find(s => s.name.toLowerCase() === selectedState.value.toLowerCase());
        if (stateDef) {
          return stateDef.districts.map(d => ({
            name: d.name,
            slug: d.name.toLowerCase()
          }));
        }
        return [];
      })
      .then(districts => {
        if (Array.isArray(districts)) {
          const sorted = districts
            .map((d: any) => ({ label: d.name, value: d.slug }))
            .sort((a, b) => a.label.localeCompare(b.label));
          setGeoDistricts(sorted);

          // Default to Jaipur if present, else first district
          const jaipur = sorted.find((d: any) => d.label.toLowerCase() === "jaipur");
          if (jaipur) {
            setSelectedDistrict(jaipur);
          } else if (sorted.length > 0) {
            setSelectedDistrict(sorted[0]);
          } else {
            setSelectedDistrict(null);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingDistricts(false));
  }, [selectedState]);

  // ── 3. Load Tehsils & Offices (Pincodes) ──
  useEffect(() => {
    if (!selectedState || !selectedDistrict) {
      setGeoTehsils([]);
      setSelectedTehsil("all");
      setDistrictPins([]);
      return;
    }

    setLoadingTehsils(true);
    setLoadingOffices(true);
    setSelectedTehsil("all");

    // Fetch tehsils mapping
    const fetchTehsilsPromise = fetch(`/api/admin/geo/tehsils?state=${selectedState.value}&district=${selectedDistrict.value}&_t=${Date.now()}`)
      .then(async r => {
        if (!r.ok) throw new Error("Tehsils error");
        return r.json();
      })
      .catch(() => {
        // Fallback to static hierarchy
        const stateDef = BASELINE_GEO_HIERARCHY.find(s => s.name.toLowerCase() === selectedState.value.toLowerCase());
        const distDef = stateDef?.districts.find(d => d.name.toLowerCase() === selectedDistrict.value.toLowerCase());
        if (distDef) {
          const map: Record<string, string[]> = {};
          distDef.tehsils.forEach(t => {
            map[t.name] = t.pincodes.map(p => p.pincode);
          });
          return map;
        }
        return {};
      });

    // Fetch district offices for pincodes & colony names
    const fetchOfficesPromise = fetch(`/api/admin/geo?type=offices&state=${selectedState.value}&district=${selectedDistrict.value}&_t=${Date.now()}`)
      .then(async r => {
        if (!r.ok) throw new Error("Offices error");
        const data = await r.json();
        return data?.offices || [];
      })
      .catch(() => {
        return [];
      });

    Promise.all([fetchTehsilsPromise, fetchOfficesPromise])
      .then(([tehsilData, offices]) => {
        // Build reverse map of pincode -> tehsil
        const pinToTehsilMap = new Map<string, string>();
        const tehsilOptions: { label: string; value: string; pincodes: string[] }[] = [];

        if (tehsilData && typeof tehsilData === "object" && !tehsilData.error) {
          let totalPinsAcrossTehsils = 0;
          Object.entries(tehsilData).forEach(([tehsilName, pins]) => {
            if (Array.isArray(pins)) {
              totalPinsAcrossTehsils += pins.length;
              pins.forEach(pin => pinToTehsilMap.set(String(pin), tehsilName));
              tehsilOptions.push({
                label: `${tehsilName} (${pins.length} PINs)`,
                value: tehsilName,
                pincodes: pins.map(String)
              });
            }
          });

          // Add 'All' option at top
          tehsilOptions.unshift({
            label: `All Tehsils in ${selectedDistrict.label} (${totalPinsAcrossTehsils} PINs)`,
            value: "all",
            pincodes: []
          });
        }
        setGeoTehsils(tehsilOptions);

        // Map offices to unique PINCODEs with major colony names
        const pinMap = new Map<string, PincodeDetail>();

        // 1. First populate from offices API
        if (Array.isArray(offices)) {
          offices.forEach((o: any) => {
            const pin = String(o.pincode || "").trim();
            if (!/^\d{6}$/.test(pin)) return;

            const rawName = String(o.officeName || o.office || "").replace(/\s+(S\.O|B\.O|H\.O|G\.P\.O\.|S\.O\.|B\.O\.|H\.O\.)(\s+|$)/gi, ' ').trim();

            if (!pinMap.has(pin)) {
              pinMap.set(pin, {
                pincode: pin,
                name: rawName || `${selectedDistrict.label} Hub`,
                tehsil: pinToTehsilMap.get(pin) || "District Central",
                district: selectedDistrict.label,
                state: selectedState.label,
                areas: rawName ? [rawName] : []
              });
            } else {
              const item = pinMap.get(pin)!;
              if (rawName && !item.areas?.includes(rawName)) {
                item.areas?.push(rawName);
              }
            }
          });
        }

        // 2. Enrich with static BASELINE_GEO_HIERARCHY & JAIPUR_VERIFIED_QUADRANTS for maximum local authenticity
        const stateDef = BASELINE_GEO_HIERARCHY.find(s => s.name.toLowerCase() === selectedState.value.toLowerCase());
        const distDef = stateDef?.districts.find(d => d.name.toLowerCase() === selectedDistrict.value.toLowerCase());
        if (distDef && stateDef) {
          distDef.tehsils.forEach(t => {
            t.pincodes.forEach(p => {
              const existing = pinMap.get(p.pincode);
              if (!existing) {
                pinMap.set(p.pincode, {
                  pincode: p.pincode,
                  name: p.name,
                  tehsil: t.name,
                  district: distDef.name,
                  state: stateDef.name,
                  areas: [p.name]
                });
              } else {
                existing.name = p.name;
                if (!existing.tehsil || existing.tehsil === "District Central") {
                  existing.tehsil = t.name;
                }
              }
            });
          });
        }

        // 3. Check Jaipur verified quadrants for prominent anchors
        if (selectedDistrict.value.toLowerCase() === "jaipur") {
          pinMap.forEach((item, pin) => {
            const quads = JAIPUR_VERIFIED_QUADRANTS[pin];
            if (quads && quads.length > 0) {
              const keyAnchors = quads.map(q => q.anchor || q.zone).filter(Boolean);
              if (keyAnchors.length > 0) {
                item.name = keyAnchors.slice(0, 3).join(", ");
              }
            }
          });
        }

        // Convert to sorted array
        const sortedPins = Array.from(pinMap.values()).sort((a, b) => a.pincode.localeCompare(b.pincode));
        setDistrictPins(sortedPins);
      })
      .catch(console.error)
      .finally(() => {
        setLoadingTehsils(false);
        setLoadingOffices(false);
      });
  }, [selectedState, selectedDistrict]);

  // ── Filtered PINCODEs based on Tehsil & Search ──
  const filteredPins = useMemo(() => {
    let result = districtPins;

    // Filter by Tehsil
    if (selectedTehsil !== "all") {
      const tehsilObj = geoTehsils.find(t => t.value === selectedTehsil);
      if (tehsilObj && tehsilObj.pincodes.length > 0) {
        const pinSet = new Set(tehsilObj.pincodes);
        result = result.filter(p => pinSet.has(p.pincode) || p.tehsil === selectedTehsil);
      } else {
        result = result.filter(p => p.tehsil === selectedTehsil);
      }
    }

    // Filter by Search text (PIN or Colony name)
    if (pinFilterSearch.trim()) {
      const q = pinFilterSearch.trim().toLowerCase();
      result = result.filter(p => 
        p.pincode.includes(q) || 
        p.name.toLowerCase().includes(q) ||
        p.tehsil.toLowerCase().includes(q) ||
        (p.areas && p.areas.some(a => a.toLowerCase().includes(q)))
      );
    }

    return result;
  }, [districtPins, selectedTehsil, geoTehsils, pinFilterSearch]);

  // Set of selected pincodes for O(1) lookups
  const selectedPincodesSet = useMemo(() => new Set(selectedPincodes), [selectedPincodes]);

  // ── Toggle Individual PIN ──
  const togglePin = (pin: string) => {
    if (selectedPincodesSet.has(pin)) {
      onChange(selectedPincodes.filter(p => p !== pin));
    } else {
      onChange([...selectedPincodes, pin]);
    }
  };

  // ── Batch Actions ──
  const handleSelectAllInView = () => {
    const visiblePins = filteredPins.map(p => p.pincode);
    const combined = Array.from(new Set([...selectedPincodes, ...visiblePins]));
    onChange(combined);
  };

  const handleDeselectAllInView = () => {
    const visiblePinsSet = new Set(filteredPins.map(p => p.pincode));
    const remaining = selectedPincodes.filter(p => !visiblePinsSet.has(p));
    onChange(remaining);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // ── Manual Paste Parser ──
  const handleManualTextChange = (text: string) => {
    setManualText(text);
    const detected = Array.from(new Set(
      text
        .split(/[\s,]+/)
        .map(p => p.trim())
        .filter(p => /^\d{6}$/.test(p))
    ));
    onChange(detected);
  };

  return (
    <div className="space-y-3.5 bg-muted/20 border border-border rounded-xl p-3.5 transition-all">
      {/* Header & Helper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border">
        <div>
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-primary" />
            {label}
            {required && <span className="text-red-500 font-bold">*</span>}
          </label>
          <p className="text-[11px] text-muted-foreground">{helperText}</p>
        </div>

        {/* Selected Count & Manual Paste Toggle */}
        <div className="flex items-center gap-2">
          <Badge 
            variant={selectedPincodes.length > 0 ? "default" : "secondary"}
            className="text-xs font-semibold px-2 py-0.5"
          >
            {selectedPincodes.length} PIN{selectedPincodes.length === 1 ? "" : "s"} Selected
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowManualPaste(!showManualPaste)}
            className="h-7 text-xs gap-1 border-border"
          >
            <Edit3 className="w-3 h-3" />
            {showManualPaste ? "Hide Raw Editor" : "Paste PINs"}
          </Button>
        </div>
      </div>

      {/* Manual Paste Direct Editor (Collapsible) */}
      {showManualPaste && (
        <div className="bg-background border border-border rounded-lg p-3 space-y-2 animate-in fade-in-0 duration-200">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-primary" />
              Raw / Comma-Separated PIN Codes Input
            </label>
            <span className="text-[10px] text-muted-foreground">Auto-syncs with chips below</span>
          </div>
          <Input
            value={manualText}
            onChange={(e) => handleManualTextChange(e.target.value)}
            placeholder="e.g. 302001, 302012, 302017, 302020"
            className="font-mono text-xs"
          />
        </div>
      )}

      {/* 3 Cascader Dropdowns: State, District, Tehsil */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Tier 1: State */}
        <SearchableDropdown
          label="1. State"
          placeholder="Select State"
          value={selectedState?.value}
          options={geoStates}
          loading={loadingStates}
          onChange={(opt) => setSelectedState(opt)}
          icon={MapPin}
        />

        {/* Tier 2: District */}
        <SearchableDropdown
          label="2. District"
          placeholder={!selectedState ? "Select state..." : "Select District"}
          value={selectedDistrict?.value}
          options={geoDistricts}
          loading={loadingDistricts}
          disabled={!selectedState || loadingDistricts}
          onChange={(opt) => setSelectedDistrict(opt)}
          icon={MapPin}
        />

        {/* Tier 3: Tehsil */}
        <SearchableDropdown
          label="3. Tehsil"
          placeholder={loadingTehsils ? "Loading tehsils..." : "All Tehsils"}
          value={selectedTehsil}
          options={geoTehsils.map(t => ({ label: t.label, value: t.value }))}
          loading={loadingTehsils}
          disabled={!selectedDistrict || loadingTehsils || geoTehsils.length === 0}
          onChange={(opt) => setSelectedTehsil(opt.value)}
          icon={Layers}
        />
      </div>

      {/* Tier 4: PINCODEs Chips Section */}
      <div className="bg-background border border-border rounded-lg p-3 space-y-2.5">
        {/* Toolbar: Search inside PINs + Batch Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Quick Filter Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={pinFilterSearch}
              onChange={(e) => setPinFilterSearch(e.target.value)}
              placeholder="Filter by PIN (e.g. 302012) or colony..."
              className="w-full pl-8 pr-7 py-1 text-xs bg-muted/30 border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {pinFilterSearch && (
              <button 
                type="button" 
                onClick={() => setPinFilterSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 1-Click Batch Actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filteredPins.length === 0}
              onClick={handleSelectAllInView}
              className="h-7 text-[11px] px-2.5 gap-1 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Plus className="w-3 h-3" />
              Select All ({filteredPins.length})
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={filteredPins.length === 0}
              onClick={handleDeselectAllInView}
              className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
            >
              Deselect in View
            </Button>
            {selectedPincodes.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-7 text-[11px] px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear ({selectedPincodes.length})
              </Button>
            )}
          </div>
        </div>

        {/* PINCODE Chips Grid */}
        {loadingOffices ? (
          <div className="py-8 flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Loading postal network for {selectedDistrict?.label || "District"}...</span>
          </div>
        ) : filteredPins.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground italic bg-muted/10 rounded-lg border border-dashed border-border p-4">
            {pinFilterSearch ? (
              <span>No pincodes matching "{pinFilterSearch}". Try clearing the search.</span>
            ) : (
              <span>No pincodes found for the selected tehsil. Select "All Tehsils" or change district.</span>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto p-1 border border-border/50 rounded-lg bg-muted/10">
            {filteredPins.map((item) => {
              const isSelected = selectedPincodesSet.has(item.pincode);
              return (
                <button
                  key={item.pincode}
                  type="button"
                  onClick={() => togglePin(item.pincode)}
                  className={`text-left p-2 rounded-lg border text-xs transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? "bg-primary/10 border-primary text-primary font-medium ring-1 ring-primary/30 shadow-xs"
                      : "bg-background border-border text-foreground hover:border-primary/50 hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold tracking-tight text-xs text-foreground">
                        {item.pincode}
                      </span>
                      {item.tehsil && item.tehsil !== "District Central" && (
                        <span className="text-[9px] px-1 py-0.2 bg-muted text-muted-foreground rounded font-normal truncate max-w-[90px]">
                          {item.tehsil}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate block mt-0.5" title={item.name}>
                      {item.name}
                    </span>
                  </div>

                  <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected ? "bg-primary text-primary-foreground" : "border border-muted-foreground/30"
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected PINs Badges Wrap */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            Assigned Serviceable Pincodes ({selectedPincodes.length}):
          </span>
          {selectedPincodes.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] text-red-500 hover:underline"
            >
              Remove All
            </button>
          )}
        </div>

        {selectedPincodes.length === 0 ? (
          <p className="text-xs text-muted-foreground italic bg-background/50 border border-dashed border-border rounded-lg p-2.5 text-center">
            No pincodes assigned yet. Click any PIN chip above or use "Select All" to assign territory.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 max-h-[100px] overflow-y-auto p-1.5 bg-background border border-border rounded-lg">
            {selectedPincodes.map((pin) => {
              // Try to find locality name for tooltip
              const staticMeta = resolveStaticHierarchy(pin);
              const jaipurQuads = JAIPUR_VERIFIED_QUADRANTS[pin];
              const tooltipName = jaipurQuads?.[0]?.anchor || staticMeta?.name || "Service Area";

              return (
                <Badge
                  key={pin}
                  variant="secondary"
                  className="font-mono text-xs pl-2 pr-1 py-0.5 bg-primary/10 text-primary border-primary/20 flex items-center gap-1 group"
                  title={`${pin} - ${tooltipName}`}
                >
                  <span>{pin}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(pin);
                    }}
                    className="w-3.5 h-3.5 rounded-full hover:bg-primary/20 flex items-center justify-center text-primary/70 hover:text-primary"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
