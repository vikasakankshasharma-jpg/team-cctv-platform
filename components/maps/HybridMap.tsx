"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import of react-leaflet components to prevent SSR errors
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {
  ssr: false,
});
const useMapEvents = dynamic(
  () => import("react-leaflet").then((mod) => mod.useMapEvents),
  { ssr: false }
);

interface MarkerProps {
  id: string;
  lat: number;
  lng: number;
  draggable?: boolean;
  onDragEnd?: (lat: number, lng: number) => void;
}

interface HybridMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: MarkerProps[];
  onClick?: (lat: number, lng: number) => void;
}

// Global declaration for Mappls (MapmyIndia)
declare global {
  interface Window {
    mappls: any;
  }
}

// Leaflet Map Click Handler Component
function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function HybridMap({
  center,
  zoom,
  markers,
  onClick,
}: HybridMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapplsMapRef = useRef<any>(null);
  const mapplsMarkersRef = useRef<{ [id: string]: any }>({});
  const [mapEngine, setMapEngine] = useState<"mappls" | "leaflet" | "loading">(
    "loading"
  );

  // Initialize MapmyIndia
  useEffect(() => {
    let mounted = true;

    const initMappls = () => {
      if (window.mappls && window.mappls.Map && mapRef.current) {
        try {
          if (!mapplsMapRef.current) {
            mapplsMapRef.current = new window.mappls.Map(mapRef.current, {
              center: [center.lat, center.lng],
              zoom: zoom,
              zoomControl: true,
              location: true,
            });

            if (onClick) {
              mapplsMapRef.current.addListener("click", (e: any) => {
                const lat = e.lngLat.lat;
                const lng = e.lngLat.lng;
                onClick(lat, lng);
              });
            }
          }
          if (mounted) setMapEngine("mappls");
        } catch (error) {
          console.error("Mappls initialization failed:", error);
          if (mounted) setMapEngine("leaflet");
        }
      } else {
        // Mappls SDK not loaded, fallback to leaflet
        if (mounted) setMapEngine("leaflet");
      }
    };

    // If script might load asynchronously, you could wait for it
    if (window.mappls) {
      initMappls();
    } else {
      setMapEngine("leaflet");
    }

    return () => {
      mounted = false;
      // Cleanup Mappls map if needed
      if (mapplsMapRef.current) {
        // Usually handled by DOM node removal, but we can clear refs
        mapplsMapRef.current = null;
      }
    };
    // Initialize once
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync center and zoom for Mappls
  useEffect(() => {
    if (mapEngine === "mappls" && mapplsMapRef.current) {
      mapplsMapRef.current.setCenter([center.lat, center.lng]);
      mapplsMapRef.current.setZoom(zoom);
    }
  }, [center, zoom, mapEngine]);

  // Sync markers for Mappls
  useEffect(() => {
    if (mapEngine === "mappls" && mapplsMapRef.current && window.mappls) {
      // Remove old markers that are not in the new list
      const newMarkerIds = new Set(markers.map((m) => m.id));
      Object.keys(mapplsMarkersRef.current).forEach((id) => {
        if (!newMarkerIds.has(id)) {
          mapplsMarkersRef.current[id].remove();
          delete mapplsMarkersRef.current[id];
        }
      });

      // Add or update markers
      markers.forEach((markerData) => {
        const existingMarker = mapplsMarkersRef.current[markerData.id];
        if (existingMarker) {
          existingMarker.setPosition([markerData.lat, markerData.lng]);
          existingMarker.setDraggable(markerData.draggable || false);
        } else {
          const newMarker = new window.mappls.Marker({
            map: mapplsMapRef.current,
            position: [markerData.lat, markerData.lng],
            draggable: markerData.draggable || false,
          });

          if (markerData.draggable && markerData.onDragEnd) {
            newMarker.addListener("dragend", () => {
              const pos = newMarker.getPosition();
              if (markerData.onDragEnd) {
                markerData.onDragEnd(pos.lat, pos.lng);
              }
            });
          }

          mapplsMarkersRef.current[markerData.id] = newMarker;
        }
      });
    }
  }, [markers, mapEngine]);

  // Leaflet Drag Handler Component (Defined inside to access marker props)
  const LeafletDraggableMarker = ({ marker }: { marker: MarkerProps }) => {
    const leafletRef = useRef<any>(null);

    const eventHandlers = React.useMemo(
      () => ({
        dragend() {
          const m = leafletRef.current;
          if (m != null) {
            const pos = m.getLatLng();
            if (marker.onDragEnd) {
              marker.onDragEnd(pos.lat, pos.lng);
            }
          }
        },
      }),
      [marker]
    );

    // Dynamic import hook creates components that don't easily export ref,
    // but react-leaflet Marker exposes ref.
    return (
      <Marker
        draggable={marker.draggable}
        eventHandlers={marker.draggable ? eventHandlers : undefined}
        position={[marker.lat, marker.lng]}
        ref={leafletRef}
      />
    );
  };

  if (mapEngine === "loading") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <span className="text-sm text-slate-500">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Container for Mappls */}
      <div
        ref={mapRef}
        className={`w-full h-full ${
          mapEngine === "mappls" ? "block" : "hidden"
        }`}
      />

      {/* Container for Leaflet */}
      {mapEngine === "leaflet" && (
        <div className="w-full h-full absolute inset-0 z-0">
          {/* We must dynamically load Leaflet CSS to avoid SSR issues or require it globally */}
          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            crossOrigin=""
          />
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={zoom}
            style={{ width: "100%", height: "100%", zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onClick={onClick} />
            {markers.map((marker) => (
              <LeafletDraggableMarker key={marker.id} marker={marker} />
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
