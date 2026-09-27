"use client";

import { useEffect, useState } from "react";
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { Loader2, User } from "lucide-react";

interface DispatchMarker {
  id: string;
  type: "service" | "delivery";
  status: string;
  title: string;
  agent_id: string;
  time_slot: string;
  coordinates: { lat: number; lng: number };
}

export function DispatchMapWidget() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-dispatch',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [markers, setMarkers] = useState<DispatchMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<DispatchMarker | null>(null);

  useEffect(() => {
    fetch("/api/operations/dispatch-map")
      .then(res => res.json())
      .then(data => {
        if (data.markers) setMarkers(data.markers);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!isLoaded || loading) {
    return (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center text-gray-500 bg-gray-50/5 rounded-xl border border-border/50">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
        <p className="font-medium">Loading Dispatch Data...</p>
      </div>
    );
  }

  // Default to Jaipur if no markers
  const center = markers.length > 0 ? markers[0].coordinates : { lat: 26.9124, lng: 75.7873 };

  return (
    <div className="w-full h-[600px] rounded-xl border border-border/50 overflow-hidden relative shadow-inner">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={11}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          styles: [
            {
              "featureType": "all",
              "elementType": "geometry.fill",
              "stylers": [{"weight": "2.00"}]
            },
            {
              "featureType": "all",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#9c9c9c"}]
            },
            {
              "featureType": "all",
              "elementType": "labels.text",
              "stylers": [{"visibility": "on"}]
            },
            {
              "featureType": "landscape",
              "elementType": "all",
              "stylers": [{"color": "#f2f2f2"}]
            },
            {
              "featureType": "landscape",
              "elementType": "geometry.fill",
              "stylers": [{"color": "#ffffff"}]
            },
            {
              "featureType": "landscape.man_made",
              "elementType": "geometry.fill",
              "stylers": [{"color": "#ffffff"}]
            },
            {
              "featureType": "poi",
              "elementType": "all",
              "stylers": [{"visibility": "off"}]
            },
            {
              "featureType": "road",
              "elementType": "all",
              "stylers": [{"saturation": -100},{"lightness": 45}]
            },
            {
              "featureType": "road",
              "elementType": "geometry.fill",
              "stylers": [{"color": "#eeeeee"}]
            },
            {
              "featureType": "road",
              "elementType": "labels.text.fill",
              "stylers": [{"color": "#7b7b7b"}]
            },
            {
              "featureType": "road",
              "elementType": "labels.text.stroke",
              "stylers": [{"color": "#ffffff"}]
            },
            {
              "featureType": "road.highway",
              "elementType": "all",
              "stylers": [{"visibility": "simplified"}]
            },
            {
              "featureType": "road.arterial",
              "elementType": "labels.icon",
              "stylers": [{"visibility": "off"}]
            },
            {
              "featureType": "transit",
              "elementType": "all",
              "stylers": [{"visibility": "off"}]
            },
            {
              "featureType": "water",
              "elementType": "all",
              "stylers": [{"color": "#46bcec"},{"visibility": "on"}]
            },
            {
              "featureType": "water",
              "elementType": "geometry.fill",
              "stylers": [{"color": "#c8d7d4"}]
            },
            {
              "featureType": "water",
              "elementType": "labels.text.fill",
              "stylers": [{"color": "#070707"}]
            },
            {
              "featureType": "water",
              "elementType": "labels.text.stroke",
              "stylers": [{"color": "#ffffff"}]
            }
          ]
        }}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.coordinates}
            onClick={() => setSelectedMarker(marker)}
            icon={{
              url: marker.type === "service" 
                ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>')
                : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#10b981" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'),
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 32)
            }}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.coordinates}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-1 min-w-[200px] text-black">
              <div className="font-bold text-sm mb-1">{selectedMarker.title}</div>
              <div className="text-xs text-gray-600 mb-2 capitalize border-b pb-2">{selectedMarker.type} - {selectedMarker.status}</div>
              
              <div className="flex items-center gap-1.5 text-xs text-gray-800 font-medium">
                <User className="w-3.5 h-3.5" />
                <span>Agent: {selectedMarker.agent_id}</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-1 pl-5">Time: {selectedMarker.time_slot}</div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
