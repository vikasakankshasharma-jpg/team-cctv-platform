"use client";

import { useEffect, useRef, useState } from "react";
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
}

export default function MapplsBoundaryMap({
  apiKey,
  boundaryType = 'city',
  boundaryQuery = 'New Delhi',
  height = '500px'
}: MapplsBoundaryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Initialize map only when the script is loaded and ref is ready
    if (mapLoaded && mapRef.current && window.mappls && !mapInstanceRef.current) {
      const map = new window.mappls.Map(mapRef.current, {
        center: [28.6139, 77.2090], // Default Center (Delhi)
        zoom: 8,
        zoomControl: true,
        location: true,
      });

      mapInstanceRef.current = map;

      // Wait for map to load fully before adding GeoAnalytics layers
      map.addListener('load', () => {
        // Load GeoAnalytics Layer
        window.mappls.getGeoAnalytics({
          map: map,
          api: boundaryType, // e.g., "city", "district", "pincode"
          query: boundaryQuery,
          attribute: "boundary", // We want the physical boundary
          transparent: false,
          fillColor: "4b96f3", // Blue fill
          fillOpacity: 0.4,
          strokeColor: "000000",
          strokeWidth: 2,
        }, (data: any) => {
          console.log("GeoAnalytics Data Loaded:", data);
          // If the boundary is found, you can optionally fit the map bounds here
          if (data && data.bounds) {
              map.fitBounds(data.bounds);
          }
        });
      });
    }

    return () => {
      // Cleanup if needed
    };
  }, [mapLoaded, boundaryType, boundaryQuery]);

  return (
    <div className="relative w-full border rounded-lg overflow-hidden shadow-sm">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-500">
          Loading Mappls Map...
        </div>
      )}
      
      {/* 
        Load the main Mappls Vector SDK.
        Notice we pass the plugin=GeoAnalytics to enable the boundary features
      */}
      <Script
        src={`https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0&callback=initMap1&plugin=GeoAnalytics`}
        onReady={() => setMapLoaded(true)}
        strategy="lazyOnload"
      />
      
      <div ref={mapRef} style={{ width: '100%', height }} />
    </div>
  );
}
