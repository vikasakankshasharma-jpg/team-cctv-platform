"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Circle, 
  Polygon, 
  Polyline, 
  useMapEvents, 
  useMap 
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default leaflet marker icon resolution in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface MapPoint {
  lat: number;
  lng: number;
}

interface CoverageMapCanvasProps {
  center: MapPoint;
  zoom: number;
  mode: "radius" | "polygon";
  radiusKm: number;
  polygonPoints: MapPoint[];
  onCenterChange: (center: MapPoint) => void;
  onAddPolygonPoint: (point: MapPoint) => void;
  onUpdatePolygonPoint?: (index: number, point: MapPoint) => void;
}

// Map Center & Fly Controller
function MapViewController({ center, zoom }: { center: MapPoint; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center?.lat && center?.lng) {
      map.flyTo([center.lat, center.lng], zoom, { duration: 0.8 });
    }
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

// Click event listener on map
function MapInteractionHandler({
  mode,
  onCenterChange,
  onAddPolygonPoint
}: {
  mode: "radius" | "polygon";
  onCenterChange: (center: MapPoint) => void;
  onAddPolygonPoint: (point: MapPoint) => void;
}) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      if (mode === "radius") {
        onCenterChange({ lat, lng });
      } else if (mode === "polygon") {
        onAddPolygonPoint({ lat, lng });
      }
    }
  });
  return null;
}

// Custom Draggable Center Marker with Red Bullseye icon
function CenterMarker({
  center,
  onDragEnd
}: {
  center: MapPoint;
  onDragEnd: (p: MapPoint) => void;
}) {
  const markerRef = useRef<any>(null);

  const customCenterIcon = useMemo(() => {
    return L.divIcon({
      className: "coverage-center-marker-icon",
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: #2563eb;
          color: white;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          cursor: grab;
        ">
          🎯
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }, []);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const m = markerRef.current;
        if (m != null) {
          const latlng = m.getLatLng();
          onDragEnd({ lat: latlng.lat, lng: latlng.lng });
        }
      }
    }),
    [onDragEnd]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[center.lat, center.lng]}
      ref={markerRef}
      icon={customCenterIcon}
    />
  );
}

// Numbered polygon vertex marker
function PolygonVertexMarker({
  point,
  index,
  onDragEnd
}: {
  point: MapPoint;
  index: number;
  onDragEnd?: (p: MapPoint) => void;
}) {
  const markerRef = useRef<any>(null);

  const vertexIcon = useMemo(() => {
    return L.divIcon({
      className: "polygon-vertex-marker-icon",
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: #7c3aed;
          color: white;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          cursor: grab;
        ">
          ${index + 1}
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }, [index]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const m = markerRef.current;
        if (m != null && onDragEnd) {
          const latlng = m.getLatLng();
          onDragEnd({ lat: latlng.lat, lng: latlng.lng });
        }
      }
    }),
    [onDragEnd]
  );

  return (
    <Marker
      draggable={!!onDragEnd}
      eventHandlers={eventHandlers}
      position={[point.lat, point.lng]}
      ref={markerRef}
      icon={vertexIcon}
    />
  );
}

export default function CoverageMapCanvas({
  center,
  zoom,
  mode,
  radiusKm,
  polygonPoints,
  onCenterChange,
  onAddPolygonPoint,
  onUpdatePolygonPoint
}: CoverageMapCanvasProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ width: "100%", height: "100%", zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapViewController center={center} zoom={zoom} />
      <MapInteractionHandler
        mode={mode}
        onCenterChange={onCenterChange}
        onAddPolygonPoint={onAddPolygonPoint}
      />

      {/* Mode A: Circular Radius */}
      {mode === "radius" && (
        <>
          <CenterMarker center={center} onDragEnd={onCenterChange} />
          <Circle
            center={[center.lat, center.lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.22,
              weight: 2
            }}
          />
        </>
      )}

      {/* Mode B: Polygon Drawing */}
      {mode === "polygon" && (
        <>
          {/* Render individual numbered vertex markers */}
          {polygonPoints.map((pt, idx) => (
            <PolygonVertexMarker
              key={`${idx}-${pt.lat}-${pt.lng}`}
              point={pt}
              index={idx}
              onDragEnd={(newPt) => {
                if (onUpdatePolygonPoint) onUpdatePolygonPoint(idx, newPt);
              }}
            />
          ))}

          {/* Polyline if exactly 2 points */}
          {polygonPoints.length === 2 && (
            <Polyline
              positions={polygonPoints.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{ color: "#7c3aed", weight: 3, dashArray: "6, 6" }}
            />
          )}

          {/* Full Polygon if >= 3 points */}
          {polygonPoints.length >= 3 && (
            <Polygon
              positions={polygonPoints.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{
                color: "#7c3aed",
                fillColor: "#8b5cf6",
                fillOpacity: 0.25,
                weight: 2.5
              }}
            />
          )}
        </>
      )}
    </MapContainer>
  );
}
