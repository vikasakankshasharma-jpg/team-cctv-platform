"use client";

import { useEffect, useState } from "react";
import HybridMap from "@/components/maps/HybridMap";
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

  if (loading) {
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
      <HybridMap
        center={center}
        zoom={11}
        markers={markers.map(m => ({
          id: m.id,
          lat: m.coordinates.lat,
          lng: m.coordinates.lng,
          iconUrl: m.type === "service"
             ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>')
             : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#10b981" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'),
          onClick: () => setSelectedMarker(m)
        }))}
      />

      {/* Info Panel Overlay (replaces InfoWindow) */}
      {selectedMarker && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur shadow-xl rounded-xl p-4 border border-slate-200 z-10 min-w-[240px]">
           <button onClick={() => setSelectedMarker(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
           </button>
           <div className="font-bold text-sm mb-1 pr-6">{selectedMarker.title}</div>
           <div className="text-xs text-slate-600 mb-3 capitalize border-b pb-2">{selectedMarker.type} - {selectedMarker.status}</div>
           
           <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
             <User className="w-3.5 h-3.5" />
             <span>Agent: {selectedMarker.agent_id}</span>
           </div>
           <div className="text-[10px] text-slate-500 mt-1 pl-5">Time: {selectedMarker.time_slot}</div>
        </div>
      )}
    </div>
  );
}
