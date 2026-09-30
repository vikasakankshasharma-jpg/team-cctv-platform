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
  boundaryType?: "district" | "pincode" | "state" | "subDistrict" | "city";
  boundaryQuery?: string;
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

  const apiKey = process.env.NEXT_PUBLIC_MAPPLS_API_KEY?.trim();
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
          renderBoundary(map, boundaryType, boundaryQuery);
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
    if (!mapInstanceRef.current || !boundaryQuery) return;
    renderBoundary(mapInstanceRef.current, boundaryType, boundaryQuery);
  }, [boundaryType, boundaryQuery, renderBoundary]);

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
