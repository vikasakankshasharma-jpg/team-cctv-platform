import React, { useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Prevent Leaflet default icon from attempting to load broken external/relative images
if (typeof window !== "undefined" && L && L.Icon && L.Icon.Default) {
  try {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "",
      iconUrl: "",
      shadowUrl: "",
    });
  } catch (_) {
    // Ignore in SSR
  }
}

// Self-contained high-visibility SVG pin to prevent broken CDN image issues ("Mark" bug)
export const createDropPinIcon = (draggable?: boolean) => {
  return L.divIcon({
    className: "custom-droppin-pin",
    html: `
      <div style="
        position: relative;
        width: 44px;
        height: 54px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        cursor: ${draggable ? 'grab' : 'pointer'};
        user-select: none;
      ">
        <!-- Ground contact shadow and pulse ring -->
        <div style="
          position: absolute;
          bottom: 1px;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 6px;
          background: rgba(15, 23, 42, 0.45);
          border-radius: 50%;
          filter: blur(1px);
        "></div>
        <div style="
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          background: #2563eb;
          border-radius: 50%;
          opacity: 0.6;
        "></div>

        <!-- High-fidelity Pin Marker -->
        <svg width="40" height="50" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35)); transition: transform 0.15s ease;">
          <!-- Pin Body -->
          <path d="M18 0C8.05888 0 0 8.05888 0 18C0 29.5 18 46 18 46C18 46 36 29.5 36 18C36 8.05888 27.9411 0 18 0Z" fill="#1D4ED8"/>
          <path d="M18 2C9.16344 2 2 9.16344 2 18C2 28.2 18 43.5 18 43.5C18 43.5 34 28.2 34 18C34 9.16344 26.8366 2 18 2Z" fill="url(#pinDropGrad)"/>
          
          <!-- Outer White Target Ring -->
          <circle cx="18" cy="17" r="7" fill="white"/>
          
          <!-- Inner Core -->
          <circle cx="18" cy="17" r="4" fill="#1D4ED8"/>
          
          <defs>
            <linearGradient id="pinDropGrad" x1="18" y1="2" x2="18" y2="44" gradientUnits="userSpaceOnUse">
              <stop stop-color="#3B82F6"/>
              <stop offset="1" stop-color="#1D4ED8"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    `,
    iconSize: [44, 54],
    iconAnchor: [22, 53], // Needle tip touches exact point
  });
};

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

  const icon = useMemo(() => {
    if (marker.iconUrl) {
      return L.icon({
        iconUrl: marker.iconUrl,
        iconSize: [40, 50],
        iconAnchor: [20, 50],
      });
    }
    return createDropPinIcon(marker.draggable);
  }, [marker.iconUrl, marker.draggable]);

  return (
    <Marker
      draggable={marker.draggable}
      eventHandlers={eventHandlers}
      position={[marker.lat, marker.lng]}
      ref={leafletRef}
      icon={icon}
    />
  );
};

export default function LeafletMapFallback({ center, zoom, markers, polylines, onClick }: LeafletMapFallbackProps) {
  return (
    <>
      <style jsx global>{`
        .custom-droppin-pin {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .leaflet-container img.leaflet-marker-icon {
          max-width: none !important;
        }
        .leaflet-marker-icon.custom-droppin-pin {
          background: transparent !important;
          border: 0 !important;
        }
      `}</style>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ width: "100%", height: "100%", zIndex: 0 }}
      >
      <MapUpdater center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>'
        url={
          (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim()
            ? `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${encodeURIComponent((process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim())}`
            : "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        }
        subdomains={["0", "1", "2", "3"]}
        maxZoom={20}
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
    </>
  );
}
