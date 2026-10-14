"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Circle, 
  Polygon, 
  Polyline, 
  Tooltip,
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

export interface QuadrantMapMarker {
  id: string; // e.g., "302020:North-East" or "302020"
  pincode: string;
  quadrantName?: string;
  areaName?: string;
  lat: number;
  lng: number;
  isSelected: boolean; // true = Green (Covered), false = Red (Uncovered)
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
  quadrantMarkers?: QuadrantMapMarker[];
  onToggleQuadrantMarker?: (id: string, currentlySelected: boolean) => void;
  showHalos?: boolean;
}

// Map Center & Fly Controller with automated size invalidation for modals
function MapViewController({ center, zoom }: { center: MapPoint; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size immediately and with multiple delays to accommodate modal transitions
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 700);

    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    const container = map.getContainer();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && container) {
      observer = new ResizeObserver(() => {
        map.invalidateSize();
      });
      observer.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", onResize);
      if (observer) observer.disconnect();
    };
  }, [map]);

  useEffect(() => {
    if (center?.lat && center?.lng) {
      map.flyTo([center.lat, center.lng], zoom, { duration: 0.6 });
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

// Interactive Quadrant micro-zone circle marker
function QuadrantMarkerItem({
  marker,
  onToggle,
  showHalos = true
}: {
  marker: QuadrantMapMarker;
  onToggle?: (id: string, currentlySelected: boolean) => void;
  showHalos?: boolean;
}) {
  const icon = useMemo(() => {
    const isSel = marker.isSelected;
    const bg = isSel ? "#16a34a" : "#dc2626";
    const symbol = isSel ? "✓" : "⭕";
    const isCompass = (name?: string) =>
      !name ||
      ['north-west', 'north-east', 'south-east', 'south-west', 'north west', 'north east', 'south west', 'south east', 'nw', 'ne', 'sw', 'se'].includes(
        String(name).trim().toLowerCase()
      );

    const nameToUse: string = (!isCompass(marker.quadrantName) && marker.quadrantName)
      ? marker.quadrantName
      : (!isCompass(marker.areaName) && marker.areaName)
        ? marker.areaName
        : "Hub";

    const shortCode = nameToUse
      .split(/[\s/&-]+/)
      .map(w => w.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || "HB";

    return L.divIcon({
      className: `quadrant-marker-icon`,
      html: `
        <div style="
          min-width: 28px;
          height: 24px;
          padding: 0 5px;
          background: ${bg};
          color: white;
          border-radius: 12px;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          user-select: none;
          transition: transform 0.15s ease, background 0.2s ease;
        " title="${marker.pincode} ${marker.quadrantName || ''}">
          <span style="font-size: 9px; margin-right: 2px;">${symbol}</span>
          <span>${shortCode}</span>
        </div>
      `,
      iconSize: [30, 24],
      iconAnchor: [15, 12]
    });
  }, [marker.isSelected, marker.quadrantName, marker.pincode]);

  const eventHandlers = useMemo(
    () => ({
      click(e: any) {
        L.DomEvent.stopPropagation(e);
        if (onToggle) {
          onToggle(marker.id, marker.isSelected);
        }
      }
    }),
    [onToggle, marker.id, marker.isSelected]
  );

  return (
    <>
      {/* Visual circle indicating delivery hub coverage halo perimeter */}
      {showHalos && (
        <Circle
          center={[marker.lat, marker.lng]}
          radius={850}
          eventHandlers={eventHandlers}
          pathOptions={{
            color: marker.isSelected ? "#16a34a" : "#dc2626",
            fillColor: marker.isSelected ? "#22c55e" : "#ef4444",
            fillOpacity: marker.isSelected ? 0.28 : 0.14,
            weight: 1.5,
            dashArray: marker.isSelected ? undefined : "4, 4"
          }}
        />
      )}
      {/* Clickable pill marker at delivery hub position */}
      <Marker
        position={[marker.lat, marker.lng]}
        icon={icon}
        eventHandlers={eventHandlers}
      >
        <Tooltip direction="top" offset={[0, -12]} opacity={0.96}>
          <div style={{ fontSize: "11px", minWidth: "140px", padding: "2px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
              <span style={{ fontWeight: 700, color: marker.isSelected ? "#15803d" : "#b91c1c" }}>
                {marker.isSelected ? "✓ COVERED" : "⭕ UNCOVERED"}
              </span>
              <span style={{ color: "#6b7280", fontWeight: 600 }}>{marker.pincode}</span>
            </div>
            {marker.quadrantName && (
              <div style={{ fontWeight: 600, marginTop: "2px", color: "#111827" }}>
                {marker.quadrantName} <span style={{ fontSize: "10px", fontWeight: 500, color: "#6b7280" }}>(Delivery Hub)</span>
              </div>
            )}
            {marker.areaName && (
              <div style={{ color: "#4b5563", fontSize: "10px", marginTop: "2px", maxWidth: "180px", whiteSpace: "normal" }}>
                {marker.areaName}
              </div>
            )}
            <div style={{ marginTop: "4px", paddingTop: "4px", borderTop: "1px solid #e5e7eb", color: "#6b7280", fontStyle: "italic", fontSize: "10px" }}>
              {marker.isSelected ? "Click to unselect (reverts to red)" : "Click to select (turns green)"}
            </div>
          </div>
        </Tooltip>
      </Marker>
    </>
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
  onUpdatePolygonPoint,
  quadrantMarkers,
  onToggleQuadrantMarker,
  showHalos = true
}: CoverageMapCanvasProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ width: "100%", height: "100%", zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
        maxZoom={20}
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

      {/* Quadrant micro-zone indicators (Red for uncovered, Green for covered) */}
      {quadrantMarkers?.map((marker) => (
        <QuadrantMarkerItem
          key={marker.id}
          marker={marker}
          onToggle={onToggleQuadrantMarker}
          showHalos={showHalos}
        />
      ))}
    </MapContainer>
  );
}
