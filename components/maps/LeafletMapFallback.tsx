import React, { useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// Leaflet icon fix for Next.js if needed, but since it's just a fallback we'll keep it simple

interface MarkerProps {
  id: string;
  lat: number;
  lng: number;
  draggable?: boolean;
  onDragEnd?: (lat: number, lng: number) => void;
}

interface LeafletMapFallbackProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: MarkerProps[];
  onClick?: (lat: number, lng: number) => void;
}

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

const LeafletDraggableMarker = ({ marker }: { marker: MarkerProps }) => {
  const leafletRef = useRef<any>(null);

  const eventHandlers = useMemo(
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

  return (
    <Marker
      draggable={marker.draggable}
      eventHandlers={marker.draggable ? eventHandlers : undefined}
      position={[marker.lat, marker.lng]}
      ref={leafletRef}
    />
  );
};

export default function LeafletMapFallback({ center, zoom, markers, onClick }: LeafletMapFallbackProps) {
  return (
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
  );
}
