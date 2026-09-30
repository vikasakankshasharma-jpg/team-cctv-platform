"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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

interface MapplsBoundaryMapProps {
  boundaryType?: "district" | "pincode" | "state" | "subDistrict" | "city" | "multi_pincode" | "zone";
  boundaryQuery?: string;
  boundaryData?: any;
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
      if (!window.mappls || !map || (!query && !dataObj)) return;

      // Remove previous layer/marker/circles
      if (currentLayerRef.current) {
        try {
          const layers = Array.isArray(currentLayerRef.current) ? currentLayerRef.current : [currentLayerRef.current];
          layers.forEach(layer => {
            if (typeof map.removeLayer === "function") {
              map.removeLayer(layer);
            } else if (window.mappls.remove) {
              window.mappls.remove({ map, layer: layer });
            }
          });
        } catch (_) {}
        currentLayerRef.current = null;
      }

      if (isMountedRef.current) setIsLoading(true);

      try {
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
                    const allAreas = data.areas || [];

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

                    // Draw sub-areas
                    for (const area of allAreas) {
                       const areaId = `${pin}:${area}`;
                       const isSelected = isEntirePinSelected || dataObj.includes(areaId);
                       
                       let aLat, aLng;
                       const cacheKey = `geo_${pin}_${area}`;
                       const cached = localStorage.getItem(cacheKey);
                       if (cached) {
                          const c = JSON.parse(cached);
                          aLat = c.lat;
                          aLng = c.lng;
                       } else {
                          await new Promise(r => setTimeout(r, 800)); // prevent rate limit
                          try {
                            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(area + " " + pin + " India")}&format=json`);
                            if (geoRes.ok) {
                               const geoData = await geoRes.json();
                               if (geoData && geoData.length > 0) {
                                  aLat = parseFloat(geoData[0].lat);
                                  aLng = parseFloat(geoData[0].lon);
                                  localStorage.setItem(cacheKey, JSON.stringify({lat: aLat, lng: aLng}));
                               }
                            }
                          } catch(e) {}
                       }

                       // Approximate if geocoding fails
                       if (!aLat || !aLng) {
                          if (pLat && pLng) {
                            const hash = area.split('').reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
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
    [onLayerLoaded]
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
        if (isMountedRef.current && boundaryQuery) {
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

  // ── 4. Re-render boundary when query/type prop changes ─────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Quick deep compare for boundaryData array to avoid flicker
    const dataStr = JSON.stringify(boundaryData || []);
    if (!boundaryQuery && dataStr === "[]") return;
    renderBoundary(mapInstanceRef.current, boundaryType, boundaryQuery || "", boundaryData);
  }, [boundaryType, boundaryQuery, JSON.stringify(boundaryData), renderBoundary]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden bg-muted/20 ${className}`}
      style={{ height }}
    >
      {(isLoading || error) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
          {error ? (
            <p className="text-xs text-destructive font-medium px-4 text-center">{error}</p>
          ) : (
            <>
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
              <span className="text-xs text-muted-foreground font-medium">
                {!sdkReady ? "Loading map…" : "Rendering boundary…"}
              </span>
            </>
          )}
        </div>
      )}

      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
