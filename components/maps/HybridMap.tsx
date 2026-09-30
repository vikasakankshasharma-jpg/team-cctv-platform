"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const LeafletMapFallback = dynamic(() => import("./LeafletMapFallback"), { ssr: false });

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

declare global {
  interface Window {
    mappls: any;
  }
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
  const [mapEngine, setMapEngine] = useState<"mappls" | "leaflet" | "loading">("loading");

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
        if (mounted) setMapEngine("leaflet");
      }
    };

    if (window.mappls) {
      initMappls();
    } else {
      setMapEngine("leaflet");
    }

    return () => {
      mounted = false;
      if (mapplsMapRef.current) {
        mapplsMapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mapEngine === "mappls" && mapplsMapRef.current) {
      mapplsMapRef.current.setCenter([center.lat, center.lng]);
      mapplsMapRef.current.setZoom(zoom);
    }
  }, [center, zoom, mapEngine]);

  useEffect(() => {
    if (mapEngine === "mappls" && mapplsMapRef.current && window.mappls) {
      const newMarkerIds = new Set(markers.map((m) => m.id));
      Object.keys(mapplsMarkersRef.current).forEach((id) => {
        if (!newMarkerIds.has(id)) {
          mapplsMarkersRef.current[id].remove();
          delete mapplsMarkersRef.current[id];
        }
      });

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

  if (mapEngine === "loading") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <span className="text-sm text-slate-500">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div
        ref={mapRef}
        className={`w-full h-full ${
          mapEngine === "mappls" ? "block" : "hidden"
        }`}
      />

      {mapEngine === "leaflet" && (
        <div className="w-full h-full absolute inset-0 z-0">
          <LeafletMapFallback center={center} zoom={zoom} markers={markers} onClick={onClick} />
        </div>
      )}
    </div>
  );
}
