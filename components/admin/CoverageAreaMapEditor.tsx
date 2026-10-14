"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { 
  CircleDot, 
  Hexagon, 
  Undo2, 
  Trash2, 
  Search, 
  Navigation, 
  MapPin, 
  Layers, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { convexHull } from "@/lib/geo/pincodePolygons";
import type { MapPoint, QuadrantMapMarker } from "./CoverageMapCanvas";

// Client-only dynamic import of Leaflet Canvas
const CoverageMapCanvas = dynamic(() => import("./CoverageMapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[360px] bg-muted/40 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="text-xs font-medium">Initializing Interactive Map Canvas...</span>
    </div>
  )
});

const DEFAULT_CENTER: MapPoint = { lat: 26.9124, lng: 75.7873 }; // Jaipur

const QUICK_LOCATIONS: { name: string; coords: MapPoint }[] = [
  { name: "Jaipur", coords: { lat: 26.9124, lng: 75.7873 } },
  { name: "Jodhpur", coords: { lat: 26.2389, lng: 73.0243 } },
  { name: "Kota", coords: { lat: 25.2138, lng: 75.8648 } },
  { name: "Udaipur", coords: { lat: 24.5854, lng: 73.7125 } },
  { name: "Ajmer", coords: { lat: 26.4499, lng: 74.6399 } },
  { name: "Bikaner", coords: { lat: 28.0229, lng: 73.3119 } },
];

const RADIUS_PRESETS = [5, 10, 15, 25, 40, 60];

interface CoverageAreaMapEditorProps {
  mode: "radius" | "polygon";
  onModeChange?: (mode: "radius" | "polygon") => void;
  center?: MapPoint;
  onCenterChange: (center: MapPoint, addressHint?: string) => void;
  radiusKm?: number;
  onRadiusKmChange: (radiusKm: number) => void;
  polygonPoints?: MapPoint[];
  onPolygonPointsChange: (points: MapPoint[]) => void;
  height?: string;
  allowModeSwitch?: boolean;
  quadrantMarkers?: QuadrantMapMarker[];
  onToggleQuadrantMarker?: (id: string, currentlySelected: boolean) => void;
  onAutoSelectInsideMap?: () => void;
  onFitMapToSelectedPins?: () => void;
  onClaimAllUncovered?: () => void;
  hubStatusFilter?: "all" | "covered" | "uncovered";
  onHubStatusFilterChange?: (filter: "all" | "covered" | "uncovered") => void;
}

export function CoverageAreaMapEditor({
  mode,
  onModeChange,
  center = DEFAULT_CENTER,
  onCenterChange,
  radiusKm = 15,
  onRadiusKmChange,
  polygonPoints = [],
  onPolygonPointsChange,
  height = "420px",
  allowModeSwitch = true,
  quadrantMarkers,
  onToggleQuadrantMarker,
  onAutoSelectInsideMap,
  onFitMapToSelectedPins,
  onClaimAllUncovered,
  hubStatusFilter: externalHubStatusFilter,
  onHubStatusFilterChange
}: CoverageAreaMapEditorProps) {
  const [zoom, setZoom] = useState<number>(11);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
  const [localityText, setLocalityText] = useState<string>("");
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [showHalos, setShowHalos] = useState(true);
  const [basemap, setBasemap] = useState<"google_roads" | "google_satellite" | "osm">("google_roads");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [internalHubStatusFilter, setInternalHubStatusFilter] = useState<"all" | "covered" | "uncovered">("all");
  const hubStatusFilter = externalHubStatusFilter !== undefined ? externalHubStatusFilter : internalHubStatusFilter;
  const setHubStatusFilter = (f: "all" | "covered" | "uncovered" | ((prev: "all" | "covered" | "uncovered") => "all" | "covered" | "uncovered")) => {
    const nextVal = typeof f === "function" ? f(hubStatusFilter) : f;
    if (onHubStatusFilterChange) {
      onHubStatusFilterChange(nextVal);
    } else {
      setInternalHubStatusFilter(nextVal);
    }
  };
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter delivery hub markers based on selected tab: All, Covered, or Uncovered
  const filteredQuadrantMarkers = useMemo(() => {
    if (!quadrantMarkers || quadrantMarkers.length === 0) return [];
    if (hubStatusFilter === "covered") {
      return quadrantMarkers.filter(m => m.isSelected);
    }
    if (hubStatusFilter === "uncovered") {
      return quadrantMarkers.filter(m => !m.isSelected);
    }
    return quadrantMarkers;
  }, [quadrantMarkers, hubStatusFilter]);

  const coveredCount = useMemo(() => {
    return quadrantMarkers ? quadrantMarkers.filter(m => m.isSelected).length : 0;
  }, [quadrantMarkers]);

  const uncoveredCount = useMemo(() => {
    return quadrantMarkers ? quadrantMarkers.filter(m => !m.isSelected).length : 0;
  }, [quadrantMarkers]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResultsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Exit fullscreen on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Reverse geocode center coordinates
  useEffect(() => {
    if (!center?.lat || !center?.lng) return;
    setIsReverseGeocoding(true);
    const timer = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${center.lat}&lon=${center.lng}&format=json&addressdetails=1`
      )
        .then((r) => r.json())
        .then((data) => {
          if (data && data.address) {
            const loc =
              data.address.suburb ||
              data.address.neighbourhood ||
              data.address.city_district ||
              data.address.city ||
              data.address.town ||
              "";
            const city = data.address.city || data.address.state_district || "";
            const state = data.address.state || "";
            const pin = data.address.postcode || "";
            const summary = [loc, city, state, pin].filter(Boolean).join(", ");
            setLocalityText(summary || data.display_name?.split(", ").slice(0, 3).join(", ") || "");
          }
        })
        .catch(() => {})
        .finally(() => setIsReverseGeocoding(false));
    }, 450);

    return () => clearTimeout(timer);
  }, [center.lat, center.lng]);

  // Debounced forward search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      setShowResultsDropdown(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery.trim()
        )}&countrycodes=in&format=json&addressdetails=1&limit=5`
      )
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSearchResults(data);
            setShowResultsDropdown(data.length > 0);
          }
        })
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (!isNaN(lat) && !isNaN(lng)) {
      const newPt = { lat, lng };
      onCenterChange(newPt, item.display_name);
      setSearchQuery("");
      setShowResultsDropdown(false);
      setZoom(13);
      toast.success(`Centered map on: ${item.display_name.split(",")[0]}`);
    }
  };

  const handleQuickJump = (loc: { name: string; coords: MapPoint }) => {
    onCenterChange(loc.coords, loc.name);
    setZoom(12);
    toast.success(`Jumped to ${loc.name}`);
  };

  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGPS(false);
        const newPt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onCenterChange(newPt, "Your GPS Location");
        setZoom(14);
        toast.success("Locked to your current location");
      },
      (err) => {
        setIsLocatingGPS(false);
        toast.error("Could not obtain GPS location: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleAddPolygonPoint = (pt: MapPoint) => {
    const updated = [...polygonPoints, pt];
    onPolygonPointsChange(updated);
  };

  const handleUpdatePolygonPoint = (index: number, pt: MapPoint) => {
    const updated = [...polygonPoints];
    updated[index] = pt;
    onPolygonPointsChange(updated);
  };

  const handleUndoPolygonPoint = () => {
    if (polygonPoints.length === 0) return;
    const updated = polygonPoints.slice(0, -1);
    onPolygonPointsChange(updated);
    toast.info("Removed last polygon point");
  };

  const handleClearPolygon = () => {
    if (polygonPoints.length === 0) return;
    onPolygonPointsChange([]);
    toast.info("Cleared all polygon points");
  };

  const handleAutoTracePolygon = () => {
    const selected = (quadrantMarkers || []).filter(m => m.isSelected);
    if (selected.length < 3) {
      toast.error("Please select at least 3 delivery hubs or PINs first to auto-trace a polygon territory");
      return;
    }
    const points = selected.map(s => ({ lat: s.lat, lng: s.lng }));
    const hull = convexHull(points);
    if (hull.length >= 3) {
      onPolygonPointsChange(hull);
      toast.success(`Auto-traced ${hull.length}-point boundary from ${selected.length} covered hubs!`);
    } else {
      toast.error("Could not construct closed polygon from selected points");
    }
  };

  const approxAreaKm2 = Math.round(Math.PI * radiusKm * radiusKm);

  return (
    <div className={`flex flex-col gap-3 bg-card ${
      isFullscreen 
        ? "fixed inset-0 z-[9999] w-screen h-screen p-4 overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        : "rounded-2xl border border-border p-4 shadow-sm"
    }`}>
      {/* Fullscreen Alert Banner */}
      {isFullscreen && (
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-4 py-2 rounded-xl flex items-center justify-between text-xs font-semibold shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Full Map View Active — Panoramic High-Resolution Territory Workspace</span>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white font-bold transition-all flex items-center gap-1.5"
            title="Exit Full Map View (or press Escape)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Exit Full Map (Esc)
          </button>
        </div>
      )}

      {/* Top Bar: Tool Selector & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Mode Selector */}
        {allowModeSwitch && (
          <div className="inline-flex rounded-xl bg-muted/60 p-1 border border-border/60 shrink-0">
            <button
              type="button"
              onClick={() => onModeChange?.("radius")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === "radius"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CircleDot className="w-3.5 h-3.5" />
              Radius Tool
            </button>
            <button
              type="button"
              onClick={() => onModeChange?.("polygon")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === "polygon"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Hexagon className="w-3.5 h-3.5" />
              Polygon Tool
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search colony, area or city (e.g. Vaishali Nagar, Jaipur)..."
              className="pl-9 pr-8 h-9 text-xs bg-background border-border/80"
            />
            {isSearching && (
              <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>

          {/* Search Dropdown */}
          {showResultsDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover py-1.5 shadow-xl text-popover-foreground max-h-56 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSearchResult(item)}
                  className="px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-start gap-2 border-b last:border-b-0 border-border/40"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 truncate">
                    <p className="font-semibold text-foreground truncate">{item.display_name.split(",")[0]}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.display_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick GPS Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseCurrentGPS}
          disabled={isLocatingGPS}
          className="h-9 px-3 text-xs gap-1.5 shrink-0 border-border"
        >
          {isLocatingGPS ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-primary" />
          )}
          <span>My GPS</span>
        </Button>
      </div>

      {/* Smart Coverage Sync & Gap Detection Bar */}
      {quadrantMarkers && quadrantMarkers.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-xs shrink-0">
              Delivery Hubs:
            </span>

            {/* Interactive Hub Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setHubStatusFilter("all")}
                className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full text-[11px] transition-all cursor-pointer ${
                  hubStatusFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary/40 font-bold"
                    : "bg-secondary text-secondary-foreground border border-border/60 hover:bg-secondary/80"
                }`}
                title="Show all delivery hubs"
              >
                <span>All ({quadrantMarkers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setHubStatusFilter(prev => prev === "covered" ? "all" : "covered")}
                className={`inline-flex items-center gap-1.5 font-semibold px-2.5 py-0.5 rounded-full text-[11px] transition-all cursor-pointer ${
                  hubStatusFilter === "covered"
                    ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/40 border border-emerald-600 font-bold"
                    : "text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
                }`}
                title="Click to filter only Covered (Green) delivery hubs. Click again to unfilter."
              >
                <span className={`w-2 h-2 rounded-full ${hubStatusFilter === "covered" ? "bg-white" : "bg-emerald-500"} animate-pulse`} />
                <span>{coveredCount} Covered (Green)</span>
              </button>

              <button
                type="button"
                onClick={() => setHubStatusFilter(prev => prev === "uncovered" ? "all" : "uncovered")}
                className={`inline-flex items-center gap-1.5 font-semibold px-2.5 py-0.5 rounded-full text-[11px] transition-all cursor-pointer ${
                  hubStatusFilter === "uncovered"
                    ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/40 border border-rose-600 font-bold"
                    : "text-rose-600 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
                }`}
                title="Click to filter only Uncovered (Red) delivery hubs. Click again to unfilter."
              >
                <span className={`w-2 h-2 rounded-full ${hubStatusFilter === "uncovered" ? "bg-white" : "bg-rose-500"}`} />
                <span>{uncoveredCount} Uncovered (Red)</span>
              </button>

              {hubStatusFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setHubStatusFilter("all")}
                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer ml-1"
                  title="Reset filter to show all hubs"
                >
                  (Reset Filter)
                </button>
              )}
            </div>

            <span className="text-[10px] text-muted-foreground hidden xl:inline italic">
              • Click any circle to toggle/revert
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {onAutoSelectInsideMap && (
              <button
                type="button"
                onClick={onAutoSelectInsideMap}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-xs flex items-center gap-1"
                title="Automatically selects all PINs and quadrants located within the drawn map boundary"
              >
                🪄 Auto-Select in Map
              </button>
            )}
            {onFitMapToSelectedPins && (
              <button
                type="button"
                onClick={onFitMapToSelectedPins}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-secondary transition-all shadow-xs flex items-center gap-1"
                title="Calculates centroid and encloses map radius or perimeter to wrap currently selected PINs"
              >
                🎯 Fit Map to PINs
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowHalos(!showHalos)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all shadow-xs flex items-center gap-1 ${
                showHalos 
                  ? "bg-secondary text-secondary-foreground border-border hover:bg-muted" 
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
              }`}
              title={showHalos ? "Hide 850m micro-service delivery halos" : "Show 850m micro-service delivery halos"}
            >
              {showHalos ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showHalos ? "Halos: ON" : "Halos: OFF"}
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all shadow-xs flex items-center gap-1 ${
                isFullscreen 
                  ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-sm" 
                  : "bg-card border-border text-foreground hover:bg-secondary"
              }`}
              title={isFullscreen ? "Exit Fullscreen View (Esc)" : "Expand to Full Map View"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? "Exit Full Map" : "Full Map View"}</span>
            </button>
            {onClaimAllUncovered && quadrantMarkers.some(m => !m.isSelected) && (
              <button
                type="button"
                onClick={onClaimAllUncovered}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-xs flex items-center gap-1"
                title="Instantly covers all remaining red micro-zones"
              >
                🛡️ Claim All Uncovered
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Jump City Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-semibold text-muted-foreground shrink-0 uppercase tracking-wider">
          Quick Jump:
        </span>
        {QUICK_LOCATIONS.map((loc) => (
          <button
            key={loc.name}
            type="button"
            onClick={() => handleQuickJump(loc)}
            className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-secondary/80 text-secondary-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border/50 shrink-0"
          >
            {loc.name}
          </button>
        ))}
      </div>

      {/* Main Map Canvas */}
      <div 
        className="relative rounded-xl overflow-hidden border border-border/80 shadow-inner transition-all duration-200"
        style={{ height: isFullscreen ? "calc(100vh - 250px)" : height }}
      >
        <CoverageMapCanvas
          center={center}
          zoom={zoom}
          mode={mode}
          radiusKm={radiusKm}
          polygonPoints={polygonPoints}
          showHalos={showHalos}
          basemap={basemap}
          onCenterChange={(newCenter) => onCenterChange(newCenter)}
          onAddPolygonPoint={handleAddPolygonPoint}
          onUpdatePolygonPoint={handleUpdatePolygonPoint}
          quadrantMarkers={filteredQuadrantMarkers}
          onToggleQuadrantMarker={onToggleQuadrantMarker}
        />

        {/* On-Map Floating Hint Box */}
        <div className="absolute top-3 left-3 z-[400] max-w-xs bg-card/95 backdrop-blur-md rounded-xl p-2.5 shadow-lg border border-border text-xs pointer-events-auto">
          {mode === "radius" ? (
            <div className="flex items-start gap-2">
              <span className="p-1 rounded-md bg-blue-500/10 text-blue-600 font-bold shrink-0">🎯</span>
              <div>
                <p className="font-semibold text-foreground">Circular Radius Mode</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  Click on the map or drag the bullseye marker to reposition the center. Use the slider below to adjust radius.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <span className="p-1 rounded-md bg-purple-500/10 text-purple-600 font-bold shrink-0">🔷</span>
              <div>
                <p className="font-semibold text-foreground">Polygon Drawing Mode</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  Click on the map to add boundary points. Add at least 3 points to create a closed polygon territory.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* On-Map Floating Controls (Top-Right): Active Filter Tag + Status Pill + Basemap Switcher + Fullscreen */}
        <div className="absolute top-3 right-3 z-[400] flex flex-col items-end gap-1.5 pointer-events-auto">
          {hubStatusFilter !== "all" && (
            <div className={`backdrop-blur-md rounded-full px-2.5 py-1 shadow-md border text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 ${
              hubStatusFilter === "covered"
                ? "bg-emerald-600/95 text-white border-emerald-500 shadow-emerald-500/20"
                : "bg-rose-600/95 text-white border-rose-500 shadow-rose-500/20"
            }`}>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>
                {hubStatusFilter === "covered"
                  ? `${coveredCount} Covered Hubs Shown`
                  : `${uncoveredCount} Uncovered Gaps Shown`}
              </span>
              <button
                type="button"
                onClick={() => setHubStatusFilter("all")}
                className="ml-1 hover:bg-white/20 rounded-full px-1 text-[10px] cursor-pointer"
                title="Reset to show all hubs"
              >
                ✕
              </button>
            </div>
          )}

          <div className="bg-card/95 backdrop-blur-md rounded-full px-3 py-1 shadow-md border border-border text-[11px] font-semibold flex items-center gap-1.5">
            {mode === "radius" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>{radiusKm} km Radius (~{approxAreaKm2} km²)</span>
              </>
            ) : (
              <>
                <span
                  className={`w-2 h-2 rounded-full ${
                    polygonPoints.length >= 3 ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                  }`}
                />
                <span>
                  {polygonPoints.length} Points {polygonPoints.length >= 3 ? "(Closed)" : "(Incomplete)"}
                </span>
              </>
            )}
          </div>

          {/* Quick Basemap Layer Toggle & Fullscreen Button */}
          <div className="bg-card/95 backdrop-blur-md rounded-lg p-0.5 shadow-md border border-border flex items-center gap-0.5 text-[10px] font-medium">
            <button
              type="button"
              onClick={() => setBasemap("google_roads")}
              className={`px-2 py-0.5 rounded-md transition-all ${
                basemap === "google_roads"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title="Google Maps Standard Road Map"
            >
              Google Roads
            </button>
            <button
              type="button"
              onClick={() => setBasemap("google_satellite")}
              className={`px-2 py-0.5 rounded-md transition-all ${
                basemap === "google_satellite"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title="Google Maps Satellite Hybrid Imagery"
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setBasemap("osm")}
              className={`px-2 py-0.5 rounded-md transition-all ${
                basemap === "osm"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title="OpenStreetMap Standard"
            >
              OSM
            </button>
            <span className="w-px h-3.5 bg-border mx-0.5" />
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-1.5 py-0.5 rounded-md text-foreground hover:bg-muted transition-colors flex items-center gap-1 font-semibold"
              title={isFullscreen ? "Exit Fullscreen View (Esc)" : "Expand to Full Map View"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-purple-600" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? "Exit Full" : "Full View"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode-Specific Controls */}
      {mode === "radius" ? (
        <div className="bg-secondary/30 rounded-xl p-3 border border-border/60 flex flex-col gap-3">
          {/* Radius Slider & Direct Value Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <span>Operating Radius</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-500/30 font-bold text-[11px]">
                    {radiusKm} km
                  </Badge>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Approx. Coverage: <strong>{approxAreaKm2} km²</strong>
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={radiusKm}
                onChange={(e) => onRadiusKmChange(parseInt(e.target.value) || 1)}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-secondary rounded-lg"
              />
            </div>

            {/* Direct Number Input */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Input
                type="number"
                min={1}
                max={150}
                value={radiusKm}
                onChange={(e) => onRadiusKmChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 h-9 text-center font-bold text-sm bg-background border-border"
              />
              <span className="text-xs font-semibold text-muted-foreground">km</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center flex-wrap gap-1.5 pt-1 border-t border-border/40">
            <span className="text-[11px] font-medium text-muted-foreground mr-1">Presets:</span>
            {RADIUS_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onRadiusKmChange(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  radiusKm === preset
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-background border-border/80 text-foreground hover:bg-secondary"
                }`}
              >
                {preset} km
              </button>
            ))}
          </div>

          {/* Center Coordinates & Resolved Address Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-muted-foreground gap-1.5 pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="font-mono text-[11px]">
                {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
              </span>
            </div>
            {localityText && (
              <span className="text-[11px] text-foreground font-medium truncate max-w-sm" title={localityText}>
                📍 {localityText}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Polygon Controls */
        <div className="bg-secondary/30 rounded-xl p-3 border border-border/60 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs font-bold ${
                  polygonPoints.length >= 3
                    ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                    : "border-amber-500/40 text-amber-600 bg-amber-500/10"
                }`}
              >
                {polygonPoints.length >= 3
                  ? `✅ Complete Polygon (${polygonPoints.length} Vertices)`
                  : `⚠️ ${polygonPoints.length}/3 Vertices Added`}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {polygonPoints.length < 3
                  ? "Click on map to drop boundary pins"
                  : "All leads falling within this perimeter are captured"}
              </span>
            </div>

            {/* Undo / Clear / Auto-Trace Actions */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoTracePolygon}
                disabled={!quadrantMarkers || quadrantMarkers.filter(m => m.isSelected).length < 3}
                className="h-8 px-2.5 text-xs gap-1 bg-purple-600/10 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white"
                title="Automatically creates a closed polygon enclosing all currently covered delivery hubs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                ⚡ Auto-Trace Territory
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUndoPolygonPoint}
                disabled={polygonPoints.length === 0}
                className="h-8 px-2.5 text-xs gap-1 border-border text-foreground hover:bg-secondary"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo Point
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearPolygon}
                disabled={polygonPoints.length === 0}
                className="h-8 px-2.5 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </Button>
            </div>
          </div>

          {/* Points Preview Chips */}
          {polygonPoints.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap max-h-20 overflow-y-auto pt-1 border-t border-border/40 text-[10px] font-mono">
              {polygonPoints.map((pt, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                >
                  #{i + 1} ({pt.lat.toFixed(3)}, {pt.lng.toFixed(3)})
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
