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
  Plus, 
  Trash2, 
  Loader2, 
  Edit3,
  Building,
  ExternalLink,
  ShieldCheck,
  Compass,
  Sparkles
} from "lucide-react";
import { 
  BASELINE_GEO_HIERARCHY, 
  CORE_ACTIVE_PINCODES,
  type StateItem,
  type DistrictItem,
  type TehsilItem,
  type PincodeItem,
  type PincodeStatus,
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
  activeCount?: number;
  totalCount?: number;
  isActive?: boolean;
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
    <div className="relative flex-1 min-w-[170px]" ref={dropdownRef}>
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-primary" />
          {label}
        </span>
        {options.length > 0 && (
          <span className="text-[10px] text-muted-foreground font-normal">
            ({options.length})
          </span>
        )}
      </label>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className={`w-full flex items-center justify-between px-3 py-2 bg-background border rounded-lg text-xs font-medium transition-all shadow-xs ${
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
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{item.label}</span>
                        {item.isActive ? (
                          <span className="text-[9px] px-1 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold rounded">
                            Active
                          </span>
                        ) : item.activeCount !== undefined && item.activeCount === 0 ? (
                          <span className="text-[9px] px-1 py-0.2 bg-muted text-muted-foreground font-normal rounded">
                            Expansion
                          </span>
                        ) : null}
                      </div>
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
 * Builds a fast client-side baseline hierarchy tree from BASELINE_GEO_HIERARCHY
 */
function buildClientBaselineTree(): StateItem[] {
  return BASELINE_GEO_HIERARCHY.map(state => {
    const districtItems: DistrictItem[] = state.districts.map(district => {
      const tehsilItems: TehsilItem[] = district.tehsils.map(tehsil => {
        const pincodeItems: PincodeItem[] = tehsil.pincodes.map(pin => {
          const isCoreActive = CORE_ACTIVE_PINCODES.has(pin.pincode);
          const status: PincodeStatus = isCoreActive ? "active" : pin.defaultStatus;
          return {
            pincode: pin.pincode,
            name: pin.name,
            status,
            tehsil: tehsil.name,
            district: district.name,
            state: state.name,
            waitlist_count: 0,
            demand_score: 0
          };
        });

        const activeCount = pincodeItems.filter(p => p.status === "active").length;
        const totalCount = pincodeItems.length;
        return {
          name: tehsil.name,
          status: activeCount === totalCount ? "active" : activeCount > 0 ? "partial" : "inactive",
          active_count: activeCount,
          total_count: totalCount,
          waitlist_count: 0,
          demand_score: 0,
          pincodes: pincodeItems
        };
      });

      const districtActiveCount = tehsilItems.reduce((acc, t) => acc + t.active_count, 0);
      const districtTotalCount = tehsilItems.reduce((acc, t) => acc + t.total_count, 0);
      return {
        name: district.name,
        state: state.name,
        status: districtActiveCount === districtTotalCount ? "active" : districtActiveCount > 0 ? "partial" : "inactive",
        active_count: districtActiveCount,
        total_count: districtTotalCount,
        waitlist_count: 0,
        demand_score: 0,
        tehsils: tehsilItems
      };
    });

    const stateActiveCount = districtItems.reduce((acc, d) => acc + d.active_count, 0);
    const stateTotalCount = districtItems.reduce((acc, d) => acc + d.total_count, 0);
    return {
      name: state.name,
      status: stateActiveCount === stateTotalCount ? "active" : stateActiveCount > 0 ? "partial" : "inactive",
      active_count: stateActiveCount,
      total_count: stateTotalCount,
      waitlist_count: 0,
      demand_score: 0,
      districts: districtItems
    };
  });
}

/**
 * 4-Tier Territory Cascader: State -> District -> Tehsil -> PINCODEs
 * Connected directly to the Authoritative Geo Hierarchy Engine.
 * Filters strictly to Active Territories by default with an optional toggle for expansion zones.
 */
export function TerritoryPincodeSelector({
  selectedPincodes,
  onChange,
  required = false,
  label = "Serviceable Territory & PIN Codes",
  helperText = "Select State, District, and Tehsil to assign serviceable PINCODEs."
}: TerritoryPincodeSelectorProps) {
  // Master Geo Hierarchy Tree (initialized synchronously from baseline for 0ms mount)
  const [geoTree, setGeoTree] = useState<StateItem[]>(() => buildClientBaselineTree());
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);

  // Operational filter: true = show only active territories with active PINs (Default), false = show expansion/pre-launch zones
  const [activeOnlyMode, setActiveOnlyMode] = useState<boolean>(true);

  // Cascader Selection State
  const [selectedStateName, setSelectedStateName] = useState<string>("Rajasthan");
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("Jaipur");
  const [selectedTehsilName, setSelectedTehsilName] = useState<string>("all");

  // Search filter inside PINCODEs matrix
  const [pinFilterSearch, setPinFilterSearch] = useState("");

  // Manual Paste Direct Editor
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [manualText, setManualText] = useState("");

  // Keep manual text in sync with external selection changes
  useEffect(() => {
    setManualText(selectedPincodes.join(", "));
  }, [selectedPincodes]);

  // ── 1. Fetch Live Geo Hierarchy from `/api/admin/geo/hierarchy` ──
  useEffect(() => {
    setIsLoadingHierarchy(true);
    fetch("/api/admin/geo/hierarchy")
      .then(async r => {
        if (!r.ok) throw new Error("Hierarchy fetch failed");
        return r.json();
      })
      .then(data => {
        if (data?.success && Array.isArray(data.tree) && data.tree.length > 0) {
          setGeoTree(data.tree);

          // Find first state with active PINs if current selected state has none
          const activeState = data.tree.find((s: StateItem) => s.active_count > 0);
          if (activeState && (!selectedStateName || !data.tree.some((s: StateItem) => s.name === selectedStateName && s.active_count > 0))) {
            setSelectedStateName(activeState.name);
            const activeDistrict = activeState.districts.find((d: DistrictItem) => d.active_count > 0);
            if (activeDistrict) {
              setSelectedDistrictName(activeDistrict.name);
            }
          }
        }
      })
      .catch(err => {
        console.warn("Using baseline geo hierarchy:", err.message);
      })
      .finally(() => {
        setIsLoadingHierarchy(false);
      });
  }, []);

  // ── 2. Filtered States based on Active Mode ──
  const availableStates = useMemo(() => {
    const list = activeOnlyMode 
      ? geoTree.filter(s => s.active_count > 0)
      : geoTree;

    return list.map(s => ({
      label: `${s.name} (${s.active_count} Active)`,
      value: s.name,
      sublabel: `${s.districts.length} Districts, ${s.total_count} PINs`,
      activeCount: s.active_count,
      totalCount: s.total_count,
      isActive: s.active_count > 0
    }));
  }, [geoTree, activeOnlyMode]);

  // Ensure selectedState is valid
  useEffect(() => {
    if (availableStates.length > 0 && !availableStates.some(s => s.value === selectedStateName)) {
      setSelectedStateName(availableStates[0].value);
    }
  }, [availableStates, selectedStateName]);

  // ── 3. Selected State Object & Available Districts ──
  const currentStateObj = useMemo(() => {
    return geoTree.find(s => s.name.toLowerCase() === selectedStateName.toLowerCase()) || null;
  }, [geoTree, selectedStateName]);

  const availableDistricts = useMemo(() => {
    if (!currentStateObj) return [];
    const distList = activeOnlyMode
      ? currentStateObj.districts.filter(d => d.active_count > 0)
      : currentStateObj.districts;

    return distList.map(d => ({
      label: `${d.name} (${d.active_count} Active)`,
      value: d.name,
      sublabel: `${d.tehsils.length} Tehsils, ${d.total_count} PINs`,
      activeCount: d.active_count,
      totalCount: d.total_count,
      isActive: d.active_count > 0
    }));
  }, [currentStateObj, activeOnlyMode]);

  // Ensure selectedDistrict is valid
  useEffect(() => {
    if (availableDistricts.length > 0 && !availableDistricts.some(d => d.value === selectedDistrictName)) {
      setSelectedDistrictName(availableDistricts[0].value);
    }
  }, [availableDistricts, selectedDistrictName]);

  // ── 4. Selected District Object & Available Tehsils ──
  const currentDistrictObj = useMemo(() => {
    if (!currentStateObj) return null;
    return currentStateObj.districts.find(d => d.name.toLowerCase() === selectedDistrictName.toLowerCase()) || null;
  }, [currentStateObj, selectedDistrictName]);

  const availableTehsils = useMemo(() => {
    if (!currentDistrictObj) return [];
    const tehList = activeOnlyMode
      ? currentDistrictObj.tehsils.filter(t => t.active_count > 0)
      : currentDistrictObj.tehsils;

    const totalActivePinsInDistrict = tehList.reduce((sum, t) => sum + (activeOnlyMode ? t.active_count : t.total_count), 0);

    const opts: DropdownOption[] = [
      {
        label: `All ${activeOnlyMode ? "Active " : ""}Tehsils (${totalActivePinsInDistrict} PINs)`,
        value: "all",
        sublabel: `${tehList.length} tehsils in ${currentDistrictObj.name}`
      },
      ...tehList.map(t => ({
        label: `${t.name} (${activeOnlyMode ? t.active_count : t.total_count} PINs)`,
        value: t.name,
        sublabel: `${t.active_count} active of ${t.total_count} total`,
        activeCount: t.active_count,
        totalCount: t.total_count,
        isActive: t.active_count > 0
      }))
    ];

    return opts;
  }, [currentDistrictObj, activeOnlyMode]);

  // Ensure selectedTehsil is valid
  useEffect(() => {
    if (selectedTehsilName !== "all" && !availableTehsils.some(t => t.value === selectedTehsilName)) {
      setSelectedTehsilName("all");
    }
  }, [availableTehsils, selectedTehsilName]);

  // ── 5. PINCODEs in Selected District / Tehsil ──
  const rawPincodesInScope = useMemo(() => {
    if (!currentDistrictObj) return [];

    let tehsils = currentDistrictObj.tehsils;
    if (activeOnlyMode) {
      tehsils = tehsils.filter(t => t.active_count > 0);
    }

    if (selectedTehsilName !== "all") {
      tehsils = tehsils.filter(t => t.name.toLowerCase() === selectedTehsilName.toLowerCase());
    }

    const pins: PincodeItem[] = [];
    tehsils.forEach(t => {
      t.pincodes.forEach(p => {
        if (!activeOnlyMode || p.status === "active") {
          pins.push(p);
        }
      });
    });

    return pins;
  }, [currentDistrictObj, activeOnlyMode, selectedTehsilName]);

  // Enrich PINs with Authentic Colony Names and Quadrants
  const enrichedPins = useMemo(() => {
    return rawPincodesInScope.map(pin => {
      let displayName = pin.name;

      // Check Jaipur verified quadrants for prominent colony anchors
      if (pin.district.toLowerCase() === "jaipur") {
        const quads = JAIPUR_VERIFIED_QUADRANTS[pin.pincode];
        if (quads && quads.length > 0) {
          const anchors = quads.map(q => q.anchor || q.zone).filter(Boolean);
          if (anchors.length > 0) {
            displayName = anchors.slice(0, 3).join(", ");
          }
        }
      }

      return {
        ...pin,
        displayName
      };
    });
  }, [rawPincodesInScope]);

  // Filter by Search Query
  const filteredPins = useMemo(() => {
    if (!pinFilterSearch.trim()) return enrichedPins;
    const q = pinFilterSearch.trim().toLowerCase();
    return enrichedPins.filter(p => 
      p.pincode.includes(q) ||
      p.displayName.toLowerCase().includes(q) ||
      p.tehsil.toLowerCase().includes(q)
    );
  }, [enrichedPins, pinFilterSearch]);

  // Lookup set for selected PINs
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

  // ── Manual Paste Sync ──
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
      {/* Top Header: Title + Mode Toggle + Link to Expansion */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-primary" />
              {label}
              {required && <span className="text-red-500 font-bold">*</span>}
            </label>

            {/* Operational Truth Mode Pill Toggle */}
            <button
              type="button"
              onClick={() => setActiveOnlyMode(!activeOnlyMode)}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                activeOnlyMode
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
              }`}
              title={activeOnlyMode ? "Showing only operational active territories" : "Showing all expansion zones"}
            >
              {activeOnlyMode ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Active Territories Only
                </>
              ) : (
                <>
                  <Compass className="w-3 h-3 text-amber-500" />
                  Showing Expansion Zones
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{helperText}</p>
        </div>

        {/* Right side: Action Hub & Expansion Link */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/admin/expansion"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-md border border-primary/20 hover:bg-primary/10 transition-colors"
          >
            <span>Expansion Hub</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <Badge 
            variant={selectedPincodes.length > 0 ? "default" : "secondary"}
            className="text-xs font-semibold px-2 py-0.5"
          >
            {selectedPincodes.length} PIN{selectedPincodes.length === 1 ? "" : "s"} Assigned
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
          value={selectedStateName}
          options={availableStates}
          loading={isLoadingHierarchy && availableStates.length === 0}
          onChange={(opt) => setSelectedStateName(opt.value)}
          icon={MapPin}
        />

        {/* Tier 2: District */}
        <SearchableDropdown
          label="2. District"
          placeholder={availableDistricts.length === 0 ? "No districts" : "Select District"}
          value={selectedDistrictName}
          options={availableDistricts}
          disabled={availableDistricts.length === 0}
          onChange={(opt) => setSelectedDistrictName(opt.value)}
          icon={MapPin}
        />

        {/* Tier 3: Tehsil */}
        <SearchableDropdown
          label="3. Tehsil"
          placeholder={availableTehsils.length === 0 ? "No tehsils" : "All Tehsils"}
          value={selectedTehsilName}
          options={availableTehsils}
          disabled={availableTehsils.length === 0}
          onChange={(opt) => setSelectedTehsilName(opt.value)}
          icon={Layers}
        />
      </div>

      {/* Tier 4: PINCODEs Interactive Chips Grid */}
      <div className="bg-background border border-border rounded-lg p-3 space-y-2.5">
        {/* Toolbar: Quick Filter + Batch Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Quick Filter Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={pinFilterSearch}
              onChange={(e) => setPinFilterSearch(e.target.value)}
              placeholder={`Filter ${filteredPins.length} PINs or colonies...`}
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
        {filteredPins.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground italic bg-muted/10 rounded-lg border border-dashed border-border p-4">
            {pinFilterSearch ? (
              <span>No pincodes matching "{pinFilterSearch}". Try clearing the search.</span>
            ) : activeOnlyMode ? (
              <div className="space-y-1">
                <p>No active pincodes found in this selection.</p>
                <p className="text-[11px] text-muted-foreground">
                  Switch to{" "}
                  <button 
                    type="button"
                    onClick={() => setActiveOnlyMode(false)}
                    className="text-primary underline font-medium"
                  >
                    Show Expansion Zones
                  </button>{" "}
                  or activate PINs in the{" "}
                  <a href="/admin/expansion" target="_blank" className="text-primary underline font-medium">
                    Expansion Hub
                  </a>.
                </p>
              </div>
            ) : (
              <span>No pincodes registered in this tehsil yet. Add new PINs via the Expansion Hub.</span>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[230px] overflow-y-auto p-1 border border-border/50 rounded-lg bg-muted/10">
            {filteredPins.map((item) => {
              const isSelected = selectedPincodesSet.has(item.pincode);
              const isActive = item.status === "active";

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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold tracking-tight text-xs text-foreground">
                        {item.pincode}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 bg-muted text-muted-foreground rounded font-normal truncate max-w-[85px]">
                        {item.tehsil}
                      </span>
                      {isActive ? (
                        <span className="text-[8px] px-1 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold rounded">
                          Active
                        </span>
                      ) : (
                        <span className="text-[8px] px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold rounded">
                          Expansion
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate block mt-0.5" title={item.displayName}>
                      {item.displayName}
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
