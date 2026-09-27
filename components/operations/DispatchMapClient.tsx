"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  MapPin, 
  Truck, 
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Car
} from "lucide-react";
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader, Circle } from "@react-google-maps/api";
import { toast } from "sonner";
import { usePincodeCoverage, PincodeData } from "@/hooks/usePincodeCoverage";
import { CoverageZone } from "@/types";

interface DispatchMarker {
  id: string;
  type: "service" | "delivery";
  status: string;
  title: string;
  agent_id: string;
  time_slot: string;
  coordinates: { lat: number; lng: number };
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "1rem",
};

const defaultCenter = { lat: 26.9124, lng: 75.7873 }; // Jaipur Default

export function DispatchMapClient() {
  const [markers, setMarkers] = useState<DispatchMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<DispatchMarker | null>(null);
  const [filterType, setFilterType] = useState<"all" | "service" | "delivery">("all");
  const [zones, setZones] = useState<CoverageZone[]>([]);
  const [rawPincodes, setRawPincodes] = useState<PincodeData[]>([]);
  const [hoveredPincodes, setHoveredPincodes] = useState<string[]>([]);

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const { enrichedPincodes, getOverlappingPincodes } = usePincodeCoverage(isMapLoaded, rawPincodes);

  useEffect(() => {
    fetchData();
    // Auto refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [markerRes, zoneRes] = await Promise.all([
        fetch(`/api/operations/dispatch-map`),
        fetch(`/api/admin/coverage-zones`)
      ]);
      const markerData = await markerRes.json();
      const zoneData = await zoneRes.json();

      if (markerData.success) {
        setMarkers(markerData.markers || []);
      }

      if (Array.isArray(zoneData)) {
        setZones(zoneData);
        // Extract all pincodes from zones and transform into PincodeData
        const extractedPincodes: Record<string, PincodeData> = {};
        zoneData.forEach(zone => {
          if (zone.pincodes_data && Array.isArray(zone.pincodes_data)) {
             zone.pincodes_data.forEach((pd: any) => {
                extractedPincodes[pd.pincode] = {
                  pincode: pd.pincode,
                  areas: [], // areas not needed for already-geocoded items
                  lat: pd.lat,
                  lng: pd.lng,
                  radius: pd.radius
                };
             });
          } else if (zone.pincodes) {
             zone.pincodes.forEach((pin: string) => {
               if (!extractedPincodes[pin]) {
                 extractedPincodes[pin] = { pincode: pin, areas: [] };
               }
             });
          }
        });
        setRawPincodes(Object.values(extractedPincodes));
      }
    } catch {
      toast.error("Failed to fetch map data");
    } finally {
      setLoading(false);
    }
  };

  const handleMapMouseMove = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const overlapping = getOverlappingPincodes(e.latLng.lat(), e.latLng.lng());
    
    const currentHovered = hoveredPincodes.slice().sort().join(",");
    const newHovered = overlapping.slice().sort().join(",");
    
    if (currentHovered !== newHovered) {
      setHoveredPincodes(overlapping);
    }
  };

  const filteredMarkers = useMemo(() => {
    if (filterType === "all") return markers;
    return markers.filter((m) => m.type === filterType);
  }, [markers, filterType]);

  const getMarkerIcon = (marker: DispatchMarker) => {
    if (typeof google === 'undefined') return undefined;
    
    let color = "#64748b"; // gray default
    if (marker.status === "completed" || marker.status === "DELIVERED") color = "#10b981"; // green
    else if (marker.status === "en_route") color = "#f59e0b"; // amber
    else if (marker.status === "site_visit" || marker.status === "in_progress") color = "#3b82f6"; // blue
    else if (marker.type === "delivery") color = "#059669"; // dark green for scheduled delivery
    else color = "#2563eb"; // blue for scheduled service

    return {
      path: marker.type === "delivery" ? google.maps.SymbolPath.FORWARD_CLOSED_ARROW : google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#ffffff",
      scale: marker.type === "delivery" ? 6 : 8,
    };
  };

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <MapPin className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Live Dispatch Map
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Bird's-eye view of all field agents, active installations, and deliveries.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === "all" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            All Active
          </button>
          <button
            onClick={() => setFilterType("service")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === "service" ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500 hover:text-blue-600"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Services
          </button>
          <button
            onClick={() => setFilterType("delivery")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === "delivery" ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500 hover:text-emerald-600"
            }`}
          >
            <Truck className="w-3.5 h-3.5" /> Deliveries
          </button>
        </div>
      </div>

      {/* MAP AREA */}
      <div className="h-[650px] w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {isMapLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={11}
            onMouseMove={handleMapMouseMove}
            options={{ disableDefaultUI: false, zoomControl: true, mapTypeControl: true }}
          >
            {/* Draw Coverage Zones */}
            {enrichedPincodes.filter(p => p.lat && p.lng).map((p) => {
              const isHovered = hoveredPincodes.includes(p.pincode);
              return (
                <Circle
                  key={`zone-${p.pincode}`}
                  center={{ lat: p.lat!, lng: p.lng! }}
                  radius={p.radius || 4000}
                  options={{
                    fillColor: isHovered ? "#10b981" : "#3b82f6",
                    fillOpacity: isHovered ? 0.3 : 0.05,
                    strokeColor: isHovered ? "#059669" : "#2563eb",
                    strokeOpacity: isHovered ? 0.8 : 0.3,
                    strokeWeight: isHovered ? 2 : 1,
                    clickable: false
                  }}
                />
              );
            })}

            {/* Draw Markers */}
            {filteredMarkers.map((marker) => (
              <MarkerF
                key={`${marker.id}-${marker.type}`}
                position={marker.coordinates}
                icon={getMarkerIcon(marker)}
                onClick={() => setSelectedMarker(marker)}
              />
            ))}

            {selectedMarker && (
              <InfoWindowF
                position={selectedMarker.coordinates}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2 text-zinc-900 max-w-[240px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      selectedMarker.type === 'delivery' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedMarker.type === 'delivery' ? 'Delivery' : 'Installation / Survey'}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                      {selectedMarker.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900">{selectedMarker.title}</h3>
                  <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Slot: {selectedMarker.time_slot}
                  </p>
                  <p className="text-xs font-mono text-zinc-400 mt-1">
                    Agent ID: {selectedMarker.agent_id.substring(0,8)}
                  </p>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500">
            Loading Google Maps Engine...
          </div>
        )}
      </div>
    </div>
  );
}

