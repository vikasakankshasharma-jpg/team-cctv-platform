"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTerritoryPolygon, getKnownCentroid, JAIPUR_METRO_BOUNDARY } from "@/lib/geo/pincodePolygons";

declare global {
  interface Window {
    mappls: any;
    mapplsClassObject: any;
    _mapplsSDKLoading: boolean;
    _mapplsSDKReady: boolean;
    _mapplsSDKCallbacks: Array<() => void>;
    _didInitialZoneFit?: boolean;
  }
}

export interface PincodeMapItem {
  pincode: string;
  status: 'covered' | 'partial' | 'uncovered';
  lat?: number;
  lng?: number;
  areas?: string[];
  agents?: string[];
  officePoints?: { lat: number; lng: number }[];
}

interface MapplsBoundaryMapProps {
  boundaryType?: "district" | "pincode" | "state" | "subDistrict" | "city" | "multi_pincode" | "zone";
  boundaryQuery?: string;
  boundaryData?: any;
  pincodes?: PincodeMapItem[];
  selectedPincode?: string | null;
  statusFilter?: "all" | "covered" | "partial" | "uncovered";
  onPincodeClick?: (pincode: string) => void;
  onResetSelection?: () => void;
  height?: string;
  className?: string;
  onLayerLoaded?: (data: any) => void;
}

/** Fetch an access token from our own backend (keeps client_secret server-side) */
async function fetchMapplsToken(): Promise<string> {
  const res = await fetch("/api/admin/mappls-token");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Token request failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.access_token) throw new Error("No access_token in response");
  return data.access_token;
}

/** Load the Mappls SDK once globally, then call back all waiting components */
function loadMapplsSDK(cb: () => void) {
  // Already loaded
  if (typeof window !== "undefined" && window._mapplsSDKReady && window.mappls) {
    cb();
    return;
  }
  // Register callback
  if (!window._mapplsSDKCallbacks) window._mapplsSDKCallbacks = [];
  window._mapplsSDKCallbacks.push(cb);

  // Already loading — just wait
  if (window._mapplsSDKLoading) return;
  window._mapplsSDKLoading = true;

  // Define the global callback BEFORE injecting the script tag
  (window as any).initMap1 = () => {
    window._mapplsSDKReady = true;
    window._mapplsSDKLoading = false;
    // Disable automatic fitbounds overriding our custom viewports
    if (window.mappls) {
      window.mappls.bnd_all = false;
    }
    const cbs = window._mapplsSDKCallbacks || [];
    window._mapplsSDKCallbacks = [];
    cbs.forEach((fn) => fn());
  };

  const apiKey = process.env.NEXT_PUBLIC_MAPPLS_API_KEY?.trim() || "607539836d89fdc1f0cd8fddb1294763";
  if (!apiKey) {
    console.error("Mappls API key is missing (NEXT_PUBLIC_MAPPLS_API_KEY)");
    return;
  }

  const script = document.createElement("script");
  script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0&callback=initMap1&plugin=GeoAnalytics`;
  script.async = true;
  script.onerror = () => {
    console.error("Mappls SDK script failed to load");
    window._mapplsSDKLoading = false;
    // Notify all waiting callbacks with an error state
    const cbs = window._mapplsSDKCallbacks || [];
    window._mapplsSDKCallbacks = [];
    cbs.forEach((fn) => fn());
  };
  document.head.appendChild(script);
}

export default function MapplsBoundaryMap({
  boundaryType = "district",
  boundaryQuery = "",
  boundaryData,
  pincodes,
  selectedPincode,
  statusFilter = "all",
  onPincodeClick,
  onResetSelection,
  height = "300px",
  className = "",
  onLayerLoaded,
}: MapplsBoundaryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const currentLayerRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const [sdkReady, setSdkReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── 1. Load SDK ──────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    loadMapplsSDK(() => {
      if (!cancelled && isMountedRef.current) {
        if (window.mappls) {
          setSdkReady(true);
        } else {
          setError("Map SDK failed to initialize. Check console for details.");
          setIsLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      isMountedRef.current = false;
    };
  }, []);

  // ── 2. Render coverage (Fallback to markers/circles) ───────────────────────
  const renderBoundary = useCallback(
    async (map: any, type: string, query: string, dataObj?: any) => {
      if (!window.mappls || !map) return;

      // Remove previous layer/marker/circles cleanly
      if (currentLayerRef.current) {
        try {
          const layers = Array.isArray(currentLayerRef.current) ? currentLayerRef.current : [currentLayerRef.current];
          layers.forEach(layer => {
            if (!layer) return;
            // 1. Official Mappls SDK overlay removal method
            try {
              if (window.mappls && typeof window.mappls.remove === "function") {
                window.mappls.remove({ map: map, layer: layer });
              }
            } catch (_) {}

            // 2. Direct instance remove method if present
            try {
              if (typeof layer.remove === "function") {
                layer.remove();
              }
            } catch (_) {}

            // 3. Fallback setMap(null) if present
            try {
              if (typeof layer.setMap === "function") {
                layer.setMap(null);
              }
            } catch (_) {}
          });
        } catch (_) {}
        currentLayerRef.current = null;
      }

      if (isMountedRef.current) setIsLoading(true);

      try {
        // ── Priority 1: Render full district coverage (Covered & Uncovered Gaps) ──
        if (pincodes && pincodes.length > 0) {
          try {
            const validPins = pincodes.filter(
              p => typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat) && !isNaN(p.lng)
            );
            const newLayers: any[] = [];

            if (validPins.length > 0) {
              const targetPin = selectedPincode ? validPins.find(p => p.pincode === selectedPincode) : null;

              if (targetPin && targetPin.lat && targetPin.lng) {
                // ── 1. ISOLATION MODE: Render ONLY the selected PIN code's exact boundary ──
                const curated = getKnownCentroid(targetPin.pincode);
                const cLat = curated ? curated.lat : targetPin.lat;
                const cLng = curated ? curated.lng : targetPin.lng;
                if (map.setCenter) map.setCenter({ lat: cLat, lng: cLng });
                if (map.setZoom) map.setZoom(13.2);

                const isCovered = targetPin.status === "covered";
                const isPartial = targetPin.status === "partial";
                const fillColor = isCovered ? "#10b981" : isPartial ? "#f59e0b" : "#ef4444";
                const strokeColor = "#2563eb"; // Distinct blue highlight for active territory
                const polyCoords = getTerritoryPolygon(targetPin.pincode, { lat: targetPin.lat, lng: targetPin.lng }, 2600, targetPin.officePoints);

                let territoryLayer: any = null;
                if (window.mappls && window.mappls.Polygon) {
                  try {
                    territoryLayer = new window.mappls.Polygon({
                      map: map,
                      paths: polyCoords,
                      fillColor: fillColor,
                      fillcolor: fillColor,
                      fillOpacity: 0.65,
                      strokeColor: strokeColor,
                      strokeOpacity: 1.0,
                      strokeWidth: 3.5,
                      fitbounds: false,
                    });
                  } catch (err) {
                    console.warn("Mappls Polygon error:", err);
                  }
                }

                if (!territoryLayer && window.mappls && window.mappls.Circle) {
                  territoryLayer = new window.mappls.Circle({
                    map: map,
                    center: { lat: cLat, lng: cLng },
                    radius: 2600,
                    fillColor: fillColor,
                    fillOpacity: 0.60,
                    strokeColor: strokeColor,
                    strokeWidth: 3,
                    fitbounds: false,
                  });
                }

                if (territoryLayer) {
                  newLayers.push(territoryLayer);
                }

                // Pinpoint marker on isolated territory centroid
                if (window.mappls && window.mappls.Marker) {
                  try {
                    const marker = new window.mappls.Marker({
                      map: map,
                      position: { lat: cLat, lng: cLng },
                      fitbounds: false,
                    });
                    newLayers.push(marker);
                  } catch (_) {}
                }

              } else {
                // ── 2. DISTRICT / CITY OVERVIEW MODE (Exact Google Maps Parity) ──
                const isJaipur = (boundaryQuery || "").toLowerCase().includes("jaipur") || validPins.some(p => p.pincode.startsWith("302"));

                if (isJaipur) {
                  // Center directly on Jaipur City at Google Maps zoom (11.4)
                  if (map.setCenter) map.setCenter({ lat: 26.8811, lng: 75.7898 });
                  if (map.setZoom) map.setZoom(11.4);

                  // Draw Google Maps Official Jaipur Outer City Boundary (Clean Red Perimeter)
                  if (window.mappls && window.mappls.Polygon) {
                    try {
                      const cityBoundary = new window.mappls.Polygon({
                        map: map,
                        paths: JAIPUR_METRO_BOUNDARY,
                        fillColor: "#ef4444",
                        fillcolor: "#ef4444",
                        fillOpacity: 0.05,
                        strokeColor: "#dc2626", // Google Maps red boundary line
                        strokeOpacity: 0.9,
                        strokeWidth: 2.5,
                        fitbounds: false,
                      });
                      newLayers.push(cityBoundary);
                    } catch (err) {
                      console.warn("City boundary render error:", err);
                    }
                  }
                } else {
                  const avgLat = validPins.reduce((sum, p) => sum + (p.lat || 0), 0) / validPins.length;
                  const avgLng = validPins.reduce((sum, p) => sum + (p.lng || 0), 0) / validPins.length;
                  if (map.setCenter) map.setCenter({ lat: avgLat, lng: avgLng });
                  const autoZoom = validPins.length < 15 ? 11.5 : (validPins.length < 35 ? 10.5 : 9.5);
                  if (map.setZoom) map.setZoom(autoZoom);
                }

                // Render clean, non-clashing interactive territory dots (Green = Covered, Red = Gap)
                const visiblePins = validPins.filter(p => !statusFilter || statusFilter === "all" || p.status === statusFilter);
                visiblePins.forEach(p => {
                  const isCovered = p.status === "covered";
                  const isPartial = p.status === "partial";
                  const dotColor = isCovered ? "#10b981" : isPartial ? "#f59e0b" : "#ef4444";
                  const dotBorder = isCovered ? "#047857" : isPartial ? "#b45309" : "#b91c1c";

                  const curated = getKnownCentroid(p.pincode);
                  const dLat = curated ? curated.lat : p.lat!;
                  const dLng = curated ? curated.lng : p.lng!;

                  if (window.mappls && window.mappls.Circle) {
                    try {
                      const bubble = new window.mappls.Circle({
                        map: map,
                        center: { lat: dLat, lng: dLng },
                        radius: 850, // Clean 850m circular territory bubble (no clashing/overlapping spikes!)
                        fillColor: dotColor,
                        fillOpacity: 0.55,
                        strokeColor: dotBorder,
                        strokeWidth: 1.5,
                        fitbounds: false,
                      });
                      if (typeof bubble.addListener === "function") {
                        bubble.addListener("click", () => {
                          onPincodeClick?.(p.pincode);
                        });
                      }
                      newLayers.push(bubble);
                    } catch (_) {}
                  }
                });
              }
            }

            currentLayerRef.current = newLayers;
            if (isMountedRef.current) setIsLoading(false);
            return;
          } catch (err) {
            console.warn("Failed to render pincodes on map:", err);
          }
        }

        if (!query && !dataObj) {
          if (isMountedRef.current) setIsLoading(false);
          return;
        }

        // Fallback: If GeoAnalytics plugin is not enabled for the API key,
        // we can place a circle for Pincodes as a coverage representation.
        if ((type === "pincode" || type === "multi_pincode") && query) {
            try {
              const queries = query.split(",");
              const newLayers: any[] = [];
              const boundsList: any[] = [];
              
              await Promise.all(queries.map(async (pinQuery) => {
                try {
                  const res = await fetch(`/api/pincode/${pinQuery.trim()}`);
                  if (res.ok) {
                    const data = await res.json();
                    let lat = data.lat;
                    let lng = data.lng;
                    let radius = data.radius || 4000;
                    
                    // Frontend Fallback if backend didn't have Google Maps API key and got blocked by Nominatim
                    if (!lat || !lng) {
                       try {
                         const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${pinQuery.trim()}+India&format=json`);
                         if (geoRes.ok) {
                           const geoData = await geoRes.json();
                           if (geoData && geoData.length > 0) {
                              lat = parseFloat(geoData[0].lat);
                              lng = parseFloat(geoData[0].lon);
                              radius = 5000;
                           }
                         }
                       } catch(e) {
                         console.warn("Frontend nominatim fallback failed:", e);
                       }
                    }

                    if (lat && lng) {
                       const circle = new window.mappls.Circle({
                         map: map,
                         center: { lat: lat, lng: lng },
                         radius: radius,
                         fillColor: "#3b82f6",
                         fillOpacity: 0.25,
                         strokeColor: "#1d4ed8",
                         strokeWidth: 2,
                       });
                       newLayers.push(circle);
                       if (circle.getBounds) {
                          boundsList.push(circle.getBounds());
                       }
                    }
                  }
                } catch (e) {}
              }));
              
              currentLayerRef.current = newLayers;
              
              if (boundsList.length > 0 && map.fitBounds) {
                // Combine bounds if multiple
                if (boundsList.length === 1) {
                   map.fitBounds(boundsList[0]);
                } else {
                   // Calculate min/max lat/lng to create a combined bounding box
                   // Note: Mappls bounds structure might be [[sw_lat, sw_lng], [ne_lat, ne_lng]] or similar
                   // Let's just use the built-in bounds extension if possible, or fall back to zooming out
                   // Actually, a simpler way is to just use the first bounds and zoom out slightly
                   map.fitBounds(boundsList[0]);
                   if (map.setZoom) map.setZoom(10);
                }
              }
            } catch (e) {
              console.warn("Failed to fetch pincode coverage:", e);
            }
        
        } else if (type === "zone" && Array.isArray(dataObj) && dataObj.length > 0) {
            try {
              const newLayers: any[] = [];
              const boundsList: any[] = [];
              const basePincodes = Array.from(new Set(dataObj.map(p => p.split(':')[0])));

              await Promise.all(basePincodes.map(async (pin) => {
                try {
                  const res = await fetch(`/api/pincode/${pin.trim()}`);
                  if (res.ok) {
                    const data = await res.json();
                    let pLat = data.lat;
                    let pLng = data.lng;
                    
                    
                    const subAreasDb = data.sub_areas || {}; // Get DB cached areas

                    // Draw main pincode circle in light gray
                    if (pLat && pLng) {
                       const circle = new window.mappls.Circle({
                         map: map,
                         center: { lat: pLat, lng: pLng },
                         radius: data.radius || 4000,
                         fillColor: "#e2e8f0",
                         fillOpacity: 0.15,
                         strokeColor: "#cbd5e1",
                         strokeWidth: 1,
                       });
                       newLayers.push(circle);
                       if (circle.getBounds) {
                          boundsList.push(circle.getBounds());
                       }
                    }

                    
                    
                    const isEntirePinSelected = dataObj.includes(pin);

                    const normalizeArea = (s: string) => {
                       if (!s) return '';
                       return s.replace(/\s+(S\.O|B\.O|H\.O|G\.P\.O\.|S\.O\.|B\.O\.|H\.O\.)(\s+|$)/gi, ' ').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
                    };

                    const drawItems = data.quadrants && data.quadrants.length > 0 ? data.quadrants.map((q: any) => ({
                      id: `${pin}:${q.zone}`,
                      name: q.zone,
                      searchQuery: `${q.anchor}, ${pin} India`,
                      cacheKey: `geo_${pin}_${q.zone.replace(/\s+/g, '')}`,
                      matchName: q.zone
                    })) : (data.areas || []).map((area: string) => ({
                      id: `${pin}:${area}`,
                      name: area,
                      searchQuery: `${area} ${pin} India`,
                      cacheKey: `geo_${pin}_${area}`,
                      matchName: area
                    }));

                    // Draw sub-areas or quadrants
                    for (const item of drawItems) {
                       const isSelected = isEntirePinSelected || dataObj.some((selected: string) => {
                          if (selected === item.id) return true;
                          if (selected.startsWith(pin + ':')) {
                             const sName = normalizeArea(selected.split(':')[1]);
                             const aName = normalizeArea(item.matchName);
                             return sName === aName || sName.includes(aName) || aName.includes(sName);
                          }
                          return false;
                       });

                       let aLat, aLng;
                       
                       // 1. Check if Firebase DB knows it (Zero API hits)
                       if (subAreasDb[item.name] && subAreasDb[item.name].lat && subAreasDb[item.name].lng) {
                          aLat = subAreasDb[item.name].lat;
                          aLng = subAreasDb[item.name].lng;
                          localStorage.setItem(item.cacheKey, JSON.stringify({lat: aLat, lng: aLng}));
                       } else {
                          // 2. Check local browser cache
                          const cached = localStorage.getItem(item.cacheKey);
                          if (cached) {
                             const c = JSON.parse(cached);
                             aLat = c.lat;
                             aLng = c.lng;
                          } else {
                             // 3. Fallback to OpenStreetMap + Save to Firebase forever!
                             await new Promise(r => setTimeout(r, 800)); // prevent rate limit
                             try {
                               const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(item.searchQuery)}&format=json`);
                               if (geoRes.ok) {
                                  const geoData = await geoRes.json();
                                  if (geoData && geoData.length > 0) {
                                     aLat = parseFloat(geoData[0].lat);
                                     aLng = parseFloat(geoData[0].lon);
                                     
                                     // Cache locally
                                     localStorage.setItem(item.cacheKey, JSON.stringify({lat: aLat, lng: aLng}));
                                     
                                     // Save permanently to Firebase (Lazy Geocoding)
                                     fetch(`/api/pincode/${pin.trim()}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ area: item.name, lat: aLat, lng: aLng })
                                     }).catch(err => console.warn('Failed to save geo to db:', err));
                                  }
                               }
                             } catch(e) {}
                          }
                       }

                       // Approximate if geocoding fails
                       if (!aLat || !aLng) {
                          if (pLat && pLng) {
                            const hash = item.name.split('').reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0);
 return a & a }, 0);
                            const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
                            const r = ((Math.abs(hash) % 20) + 5) * 0.001; // offset by 0.005 to 0.025 degrees
                            aLat = pLat + (r * Math.cos(angle));
                            aLng = pLng + (r * Math.sin(angle));
                          } else {
                            continue;
                          }
                       }

                       const areaCircle = new window.mappls.Circle({
                         map: map,
                         center: { lat: aLat, lng: aLng },
                         radius: 1200, // 1.2km radius for sub-areas
                         fillColor: isSelected ? "#3b82f6" : "#ef4444",
                         fillOpacity: isSelected ? 0.4 : 0.2,
                         strokeColor: isSelected ? "#1d4ed8" : "#dc2626",
                         strokeWidth: 2,
                       });
                       newLayers.push(areaCircle);
                    }
                  }
                } catch(e) {}
              }));

              currentLayerRef.current = newLayers;
              // Only fit bounds if we have them and it's the first time drawing this set of pincodes
              // We can rely on the user zooming manually after the initial render.
              if (boundsList.length > 0 && map.fitBounds && !window._didInitialZoneFit) {
                 window._didInitialZoneFit = true;
                 map.fitBounds(boundsList[0]);
              }
            } catch (e) {
              console.warn("Failed to render zone multi-areas:", e);
            }

        } else if (type === "district" && query) {
            // For districts, we can use Nominatim to at least center the map
            try {
               const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}+District+India&format=json`);
               if (geoRes.ok) {
                 const geoData = await geoRes.json();
                 if (geoData && geoData.length > 0) {
                    if (map.setCenter) {
                        map.setCenter({ lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) });
                        if (map.setZoom) map.setZoom(9);
                    }
                 }
               }
            } catch (e) {
               console.warn("Failed to geocode district:", e);
            }
        }

        if (isMountedRef.current) setIsLoading(false);
      } catch (err) {
        console.warn("Boundary rendering error:", err);
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [onLayerLoaded, pincodes, selectedPincode, statusFilter, onPincodeClick]
  );

  // ── 3. Initialize map once SDK is ready ────────────────────────────────────
  useEffect(() => {
    if (!sdkReady || !mapContainerRef.current || mapInstanceRef.current) return;

    // Mappls SDK requires a string element ID, not a DOM element
    const containerId = "mappls-map-" + Math.random().toString(36).slice(2, 9);
    mapContainerRef.current.id = containerId;

    try {
      const map = new window.mappls.Map(containerId, {
        center: { lat: 20.5937, lng: 78.9629 }, // Centre of India
        zoom: 5,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      const onLoad = () => {
        if (isMountedRef.current && (boundaryQuery || (pincodes && pincodes.length > 0))) {
          renderBoundary(map, boundaryType, boundaryQuery || "", boundaryData);
        } else {
          if (isMountedRef.current) setIsLoading(false);
        }
      };

      map.addListener("load", onLoad);
    } catch (e: any) {
      console.error("Mappls Map init error:", e);
      setError(e?.message || "Map failed to initialize.");
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady]);

  // ── 4. Re-render boundary when query/type/pincodes prop changes ─────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const dataStr = JSON.stringify(boundaryData || []);
    if (!boundaryQuery && dataStr === "[]" && (!pincodes || pincodes.length === 0)) return;
    renderBoundary(mapInstanceRef.current, boundaryType, boundaryQuery || "", boundaryData);
  }, [boundaryType, boundaryQuery, JSON.stringify(boundaryData), pincodes, selectedPincode, statusFilter, renderBoundary]);

  const activeSelectedPin = selectedPincode && pincodes 
    ? pincodes.find(p => p.pincode === selectedPincode) 
    : null;

  const coveredCount = (pincodes || []).filter(p => p.status === 'covered').length;
  const uncoveredCount = (pincodes || []).filter(p => p.status === 'uncovered').length;
  const partialCount = (pincodes || []).filter(p => p.status === 'partial').length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden bg-muted/20 ${className}`}
      style={{ height }}
    >
      {(isLoading || error) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
          {error ? (
            <p className="text-xs text-destructive font-medium px-4 text-center">{error}</p>
          ) : (
            <>
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
              <span className="text-xs text-muted-foreground font-medium">
                {!sdkReady ? "Loading map…" : "Rendering coverage map…"}
              </span>
            </>
          )}
        </div>
      )}

      {/* Floating Territory Coverage Legend */}
      {pincodes && pincodes.length > 0 && (
        <div className="absolute top-3 right-3 z-10 bg-background/90 backdrop-blur-md border border-border rounded-xl p-2.5 shadow-lg text-xs space-y-1.5 pointer-events-auto">
          {activeSelectedPin ? (
            <div className="flex flex-col gap-1.5 min-w-[170px]">
              <div className="font-bold text-[11px] text-foreground uppercase tracking-wider flex items-center justify-between gap-2 pb-1 border-b border-border/50">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Isolated Territory
                </span>
                <Badge variant="outline" className="font-mono text-[10px] font-bold border-blue-500/30 text-blue-600 bg-blue-500/10">
                  {activeSelectedPin.pincode}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">Isolating boundary for {activeSelectedPin.pincode}</p>
              {onResetSelection && (
                <button
                  type="button"
                  onClick={onResetSelection}
                  className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 pt-0.5 border-t border-border/40"
                >
                  <RotateCcw className="w-3 h-3" />
                  Show All {pincodes.length} District PINs
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="font-bold text-[11px] text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-border/50">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Choropleth Territory View
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 shadow-sm border border-emerald-600 inline-block" />
                  <span className="text-foreground font-semibold">Covered ({coveredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-500 shadow-sm border border-rose-600 inline-block" />
                  <span className="text-foreground font-semibold">Gaps ({uncoveredCount})</span>
                </div>
                {partialCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-amber-500 shadow-sm border border-amber-600 inline-block" />
                    <span className="text-foreground font-semibold">Partial ({partialCount})</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Selected Pincode Card */}
      {activeSelectedPin && (
        <div className="absolute bottom-3 left-3 z-10 bg-background/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl max-w-xs text-xs pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <MapPin className={`w-3.5 h-3.5 ${activeSelectedPin.status === 'covered' ? 'text-emerald-500' : 'text-rose-500'}`} />
              <span className="font-mono font-bold text-sm text-foreground">{activeSelectedPin.pincode}</span>
            </div>
            <Badge variant="outline" className={`text-[10px] uppercase font-bold ${
              activeSelectedPin.status === 'covered' 
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
            }`}>
              {activeSelectedPin.status === 'covered' ? 'Covered' : 'Unstaffed Gap'}
            </Badge>
          </div>
          {activeSelectedPin.areas && activeSelectedPin.areas.length > 0 && (
            <p className="text-[11px] text-muted-foreground line-clamp-1 mb-1.5">
              {activeSelectedPin.areas.slice(0, 3).join(", ")}
            </p>
          )}
          <div className="text-[11px] font-medium text-foreground mb-2">
            {activeSelectedPin.agents && activeSelectedPin.agents.length > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400">👤 {activeSelectedPin.agents.join(", ")}</span>
            ) : (
              <span className="text-rose-500">⚠️ No sales agent deployed</span>
            )}
          </div>
          {onResetSelection && (
            <button
              type="button"
              onClick={onResetSelection}
              className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Full District View
            </button>
          )}
        </div>
      )}

      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
