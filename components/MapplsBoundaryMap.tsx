"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";

// Define TypeScript interfaces for the Mappls global object
declare global {
  interface Window {
    mappls: any;
    mapplsClassObject: any;
  }
}

interface MapplsBoundaryMapProps {
  apiKey: string;
  // e.g., 'state', 'district', 'subDistrict', 'city', 'pincode'
  boundaryType?: 'state' | 'district' | 'subDistrict' | 'city' | 'pincode';
  // The actual name or code to search for, e.g., 'New Delhi' or '110020'
  boundaryQuery?: string;
  height?: string;
  className?: string;
  onLayerLoaded?: (data: any) => void;
}

export default function MapplsBoundaryMap({
  apiKey,
  boundaryType = 'city',
  boundaryQuery = 'New Delhi',
  height = '500px',
  className = '',
  onLayerLoaded
}: MapplsBoundaryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isRenderingLayer, setIsRenderingLayer] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const currentLayerRef = useRef<any>(null);

  // Function to render or update GeoAnalytics boundary
  const renderBoundary = useCallback((map: any, type: string, query: string) => {
    if (!window.mappls || !map || !query) return;

    try {
      // Remove previous layer if exists
      if (currentLayerRef.current) {
        if (typeof map.removeLayer === 'function') {
          map.removeLayer(currentLayerRef.current);
        } else if (window.mappls.remove) {
          window.mappls.remove({ map, layer: currentLayerRef.current });
        }
        currentLayerRef.current = null;
      }

      setIsRenderingLayer(true);

      window.mappls.getGeoAnalytics({
        map: map,
        api: type,
        query: query,
        attribute: "boundary",
        transparent: false,
        fillColor: "3b82f6", // Modern Tailwind Blue
        fillOpacity: 0.35,
        strokeColor: "1d4ed8",
        strokeWidth: 2,
      }, (data: any) => {
        setIsRenderingLayer(false);
        if (data) {
          currentLayerRef.current = data;
          if (data.bounds && map.fitBounds) {
            map.fitBounds(data.bounds);
          }
          if (onLayerLoaded) {
            onLayerLoaded(data);
          }
        }
      });
    } catch (err) {
      console.warn("Mappls GeoAnalytics render notice:", err);
      setIsRenderingLayer(false);
    }
  }, [onLayerLoaded]);

  // Initial Map Load
  useEffect(() => {
    if (mapLoaded && mapRef.current && window.mappls && !mapInstanceRef.current) {
      try {
        const map = new window.mappls.Map(mapRef.current, {
          center: [28.6139, 77.2090], // Default Center (Delhi)
          zoom: 9,
          zoomControl: true,
          location: true,
        });

        mapInstanceRef.current = map;

        map.addListener('load', () => {
          if (boundaryQuery) {
            renderBoundary(map, boundaryType, boundaryQuery);
          }
        });
      } catch (e) {
        console.error("Failed to initialize Mappls Map:", e);
      }
    }
  }, [mapLoaded, renderBoundary, boundaryType, boundaryQuery]);

  // Handle prop updates when boundaryType or boundaryQuery changes dynamically
  useEffect(() => {
    if (mapInstanceRef.current && boundaryQuery) {
      renderBoundary(mapInstanceRef.current, boundaryType, boundaryQuery);
    }
  }, [boundaryType, boundaryQuery, renderBoundary]);

  // Define callback for Mappls script
  useEffect(() => {
    (window as any).initMap1 = () => {
      setMapLoaded(true);
    };
  }, []);

  return (
    <div className={`relative w-full border border-border rounded-xl overflow-hidden shadow-sm bg-card ${className}`}>
      {(!mapLoaded || isRenderingLayer) && (
        <div className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-border shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          {!mapLoaded ? "Loading Mappls..." : "Updating Boundary..."}
        </div>
      )}

      <Script
        src={`https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0&callback=initMap1&plugin=GeoAnalytics`}
        strategy="lazyOnload"
      />

      <div ref={mapRef} style={{ width: '100%', height }} />
    </div>
  );
}
