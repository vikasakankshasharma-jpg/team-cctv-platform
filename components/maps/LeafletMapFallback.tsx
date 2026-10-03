import React, { useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for broken default marker icons in Next.js/Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MarkerProps {
  id: string;
  lat: number;
  lng: number;
  draggable?: boolean;
  onDragEnd?: (lat: number, lng: number) => void;
  iconUrl?: string;
  onClick?: () => void;
}

interface PolylineProps {
  id: string;
  path: { lat: number; lng: number }[];
  color?: string;
  weight?: number;
  opacity?: number;
}

interface LeafletMapFallbackProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: MarkerProps[];
  polylines?: PolylineProps[];
  onClick?: (lat: number, lng: number) => void;
}

function MapUpdater({ center, zoom }: { center: { lat: number; lng: number }, zoom: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom() || zoom, { animate: true });
  }, [center.lat, center.lng, map, zoom]);
  return null;
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
      click() {
        if (marker.onClick) {
          marker.onClick();
        }
      }
    }),
    [marker]
  );

  return (
    <Marker
      draggable={marker.draggable}
      eventHandlers={eventHandlers}
      position={[marker.lat, marker.lng]}
      ref={leafletRef}
    />
  );
};

export default function LeafletMapFallback({ center, zoom, markers, polylines, onClick }: LeafletMapFallbackProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ width: "100%", height: "100%", zIndex: 0 }}
    >
      <MapUpdater center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onClick={onClick} />
      {markers.map((marker) => (
        <LeafletDraggableMarker key={marker.id} marker={marker} />
      ))}
      {polylines && polylines.map((poly) => (
        <Polyline 
          key={poly.id} 
          positions={poly.path.map(p => [p.lat, p.lng] as [number, number])} 
          pathOptions={{ color: poly.color || '#3b82f6', weight: poly.weight || 4, opacity: poly.opacity || 0.8 }} 
        />
      ))}
    </MapContainer>
  );
}
