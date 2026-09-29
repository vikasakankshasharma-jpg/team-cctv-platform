"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    mappls: any;
    mapplsClassObject: any;
    _mapplsSDKLoading: boolean;
    _mapplsSDKReady: boolean;
    _mapplsSDKCallbacks: Array<() => void>;
  }
}

interface MapplsBoundaryMapProps {
  apiKey: string;
  boundaryType?: "district" | "pincode" | "state" | "subDistrict" | "city";
  boundaryQuery?: string;
  height?: string;
  className?: string;
  onLayerLoaded?: (data: any) => void;
}

/** Load the Mappls SDK once globally, then call back all waiting components */
function loadMapplsSDK(apiKey: string, cb: () => void) {
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

  const script = document.createElement("script");
  script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0&callback=initMap1&plugin=GeoAnalytics`;
  script.async = true;
  script.onerror = () => {
    console.error("Mappls SDK failed to load. Check your API key and CSP headers.");
    window._mapplsSDKLoading = false;
  };
  document.head.appendChild(script);
}

export default function MapplsBoundaryMap({
  apiKey,
  boundaryType = "district",
  boundaryQuery = "",
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

  // ── 1. Load SDK once ───────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    if (!apiKey) {
      setError("No API key provided.");
      setIsLoading(false);
      return;
    }
    loadMapplsSDK(apiKey, () => {
      if (isMountedRef.current) setSdkReady(true);
    });
    return () => {
      isMountedRef.current = false;
    };
  }, [apiKey]);

  // ── 2. Render boundary onto map ────────────────────────────────────────────
  const renderBoundary = useCallback(
    (map: any, type: string, query: string) => {
      if (!window.mappls || !map || !query) return;

      // Remove previous layer
      if (currentLayerRef.current) {
        try {
          if (typeof map.removeLayer === "function") {
            map.removeLayer(currentLayerRef.current);
          } else if (window.mappls.remove) {
            window.mappls.remove({ map, layer: currentLayerRef.current });
          }
        } catch (_) {}
        currentLayerRef.current = null;
      }

      if (isMountedRef.current) setIsLoading(true);

      try {
        window.mappls.getGeoAnalytics(
          {
            map,
            api: type,
            query,
            attribute: "boundary",
            transparent: false,
            fillColor: "3b82f6",
            fillOpacity: 0.25,
            strokeColor: "1d4ed8",
            strokeWidth: 2,
          },
          (data: any) => {
            if (!isMountedRef.current) return;
            setIsLoading(false);
            if (data) {
              currentLayerRef.current = data;
              if (data.bounds && map.fitBounds) {
                map.fitBounds(data.bounds);
              }
              if (onLayerLoaded) onLayerLoaded(data);
            }
          }
        );
      } catch (err) {
        console.warn("GeoAnalytics error:", err);
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [onLayerLoaded]
  );

  // ── 3. Initialize map once SDK is ready ────────────────────────────────────
  useEffect(() => {
    if (!sdkReady || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = new window.mappls.Map(mapContainerRef.current, {
        center: [20.5937, 78.9629], // Centre of India
        zoom: 5,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // The 'load' event fires when the base tiles are ready
      const onLoad = () => {
        if (isMountedRef.current && boundaryQuery) {
          renderBoundary(map, boundaryType, boundaryQuery);
        } else {
          if (isMountedRef.current) setIsLoading(false);
        }
      };

      map.addListener("load", onLoad);
    } catch (e) {
      console.error("Mappls Map init error:", e);
      setError("Map failed to initialize.");
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady]);

  // ── 4. Re-render boundary when query/type prop changes ─────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !boundaryQuery) return;
    renderBoundary(mapInstanceRef.current, boundaryType, boundaryQuery);
  }, [boundaryType, boundaryQuery, renderBoundary]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden bg-muted/20 ${className}`}
      style={{ height }}
    >
      {/* Loading / Error overlay */}
      {(isLoading || error) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
          {error ? (
            <p className="text-xs text-destructive font-medium px-4 text-center">{error}</p>
          ) : (
            <>
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
              <span className="text-xs text-muted-foreground font-medium">
                {!sdkReady ? "Loading map SDK…" : "Rendering boundary…"}
              </span>
            </>
          )}
        </div>
      )}

      {/* Map container — always present so the DOM node is ready for the SDK */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
