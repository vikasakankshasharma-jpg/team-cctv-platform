"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, MapPin, Navigation, CheckCircle2, Lock, ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import type { Address } from "@/types";
import { useJsApiLoader, GoogleMap, MarkerF } from "@react-google-maps/api";

interface SiteDetailsModalProps {
  onConfirm: (address: Address) => void;
  onClose: () => void;
  initialPincode?: string;
}

export function SiteDetailsModal({ onConfirm, onClose, initialPincode = "" }: SiteDetailsModalProps) {
  const [pincode, setPincode] = useState(initialPincode);
  const [landmark1, setLandmark1] = useState("");
  const [landmark2, setLandmark2] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [coords, setCoords] = useState({ lat: 19.0760, lng: 72.8777 });
  const [isMapReady, setIsMapReady] = useState(false);
  const [postOffices, setPostOffices] = useState<any[]>([]);
  const [selectedPostOffice, setSelectedPostOffice] = useState("");
  const [areaInfo, setAreaInfo] = useState("");
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyAPRR097NlrXF-8BiJ_sbnzzQw9NQYdtnA";
  const hasValidMapKey = googleMapsApiKey && !googleMapsApiKey.includes("undefined") && googleMapsApiKey.startsWith("AIza");

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey
  });

  useEffect(() => {
    if (loadError) {
      console.error("🌐 Google Maps Load Fault:", loadError);
    }
  }, [loadError]);

  const [map, setMap] = useState<unknown>(null);

  const onLoad = useCallback(function callback(map: unknown) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: unknown) {
    setMap(null);
  }, []);

  const lastFetchedPincode = useRef<string>("");

  useEffect(() => {
    if (pincode.length !== 6) {
      setIsMapReady(false);
      setPostOffices([]);
      setAreaInfo("");
      setSelectedPostOffice("");
      lastFetchedPincode.current = ""; // Reset when invalid
      return;
    }

    if (lastFetchedPincode.current === pincode) {
      return; // Already fetched or fetching this exact pincode
    }
    
    lastFetchedPincode.current = pincode;

    setIsMapReady(true);
    setCoords({ lat: 26.9124, lng: 75.7873 }); // Default to Jaipur

    const controller = new AbortController();
    const { signal } = controller;

    const fetchPincode = async () => {
        setIsFetchingPincode(true);
        
        try {
          try {
            const { verifyPincodeAction } = await import("@/app/actions/pincode");
            // Server Actions don't support AbortController signals natively across network easily,
            // but we can just check if aborted after returning.
            const result = await verifyPincodeAction(pincode);
            
            if (signal.aborted) return;
            
            if (result.success && result.offices) {
              setPostOffices(result.offices);
              setAreaInfo(`${result.district}, ${result.state}`);
              if (result.offices.length > 0) setSelectedPostOffice(result.offices[0].Name);
            } else {
              setPostOffices([]);
              setAreaInfo("");
              setSelectedPostOffice("");
            }
          } catch (err: any) {
            if (!signal.aborted) {
              console.error("Pincode API failed:", err);
              setPostOffices([]);
              setAreaInfo("");
              setSelectedPostOffice("");
            }
          }
  
          // Geocode using OpenStreetMap Nominatim (free)
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${pincode}+India`,
              { signal }
            );
            const geoData = await geoRes.json();
            if (geoData && geoData.length > 0) {
              setCoords({ lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) });
            }
          } catch (geoErr) {
            if ((geoErr as Error).name !== "AbortError") console.error("Geocoding failed:", geoErr);
          }
        } finally {
          setIsFetchingPincode(false);
        }
      };

    fetchPincode();

    return () => controller.abort();
  }, [pincode]);

  const handleConfirm = () => {
    let finalAddress = fullAddress;
    if (selectedPostOffice && areaInfo) {
       finalAddress = `${fullAddress ? fullAddress + ', ' : ''}${selectedPostOffice}, ${areaInfo}`;
    }
    
    onConfirm({
      pincode,
      landmark1,
      landmark2,
      full_address: finalAddress,
      coordinates: coords
    });
  };

  const isValid = pincode.length === 6 && landmark1.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full sm:max-w-2xl bg-white sm:rounded-[40px] shadow-[0_60px_120px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-bottom-4 duration-300 z-10 flex flex-col max-h-[98vh] sm:max-h-[min(800px,90vh)]">

        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 shrink-0" />

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* Header */}
          <div className="px-5 sm:px-8 pt-5 sm:pt-8 pb-5 sm:pb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Site Capture</span>
              </div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tighter">Pinpoint Your Site</h2>
              <p className="text-sm text-zinc-400 font-medium mt-1">Required for PDF blueprint & installation dispatch.</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors shrink-0 mt-1"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Body — two column on md+ */}
          <div className="px-5 sm:px-8 pb-5 sm:pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT: Form */}
          <div className="space-y-4">

            {/* Pincode */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Area Pincode *</label>
              <div className="relative">
                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                 <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="400001"
                  className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl pl-11 pr-4 py-3.5 outline-none transition-all font-mono font-black text-zinc-900 tracking-[0.3em] placeholder:text-zinc-300 placeholder:font-normal placeholder:tracking-normal"
                />
                {pincode.length === 6 && (
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Smart Area & Location Autofill */}
            {pincode.length === 6 && (
              <div className="space-y-4 animate-in fade-in duration-300 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                {isFetchingPincode ? (
                  <div className="flex items-center gap-2 text-blue-600 text-xs font-bold">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    Fetching regional details...
                  </div>
                ) : postOffices.length > 0 ? (
                  <>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-blue-800 uppercase tracking-[0.2em] ml-1">Area Details</label>
                       <div className="w-full bg-blue-100/50 border border-transparent rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 border-dashed border-blue-200">
                         {areaInfo}
                       </div>
                    </div>
                    {postOffices.length > 1 ? (
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-blue-800 uppercase tracking-[0.2em] ml-1">Pinpoint Location</label>
                         <select 
                           value={selectedPostOffice}
                           onChange={(e) => setSelectedPostOffice(e.target.value)}
                           className="w-full bg-white border border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-4 py-3 outline-none transition-all text-sm font-bold text-zinc-900 cursor-pointer"
                         >
                           {postOffices.map((po, idx) => (
                             <option key={idx} value={po.Name}>{po.Name}</option>
                           ))}
                         </select>
                         <p className="text-[10px] text-blue-600/80 font-medium ml-1">Multiple areas found. Please select yours.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-blue-800 uppercase tracking-[0.2em] ml-1">Pinpoint Location</label>
                         <div className="w-full bg-blue-100/50 border border-transparent rounded-xl px-4 py-3 text-sm font-bold text-zinc-900">
                           {selectedPostOffice}
                         </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs font-bold text-amber-600 bg-amber-50 p-2 rounded-lg">
                    System could not auto-fetch the area. Please ensure pincode is valid or enter details manually.
                  </div>
                )}
              </div>
            )}

            {/* Primary Landmark */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Primary Landmark *</label>
              <input
                type="text"
                value={landmark1}
                onChange={(e) => setLandmark1(e.target.value)}
                placeholder="Near Metro, Opp. Temple..."
                className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 outline-none transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-300"
              />
            </div>

            {/* Full Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Full Address</label>
              <textarea
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="Building, Wing, Unit No., Street..."
                rows={2}
                className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 outline-none transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-300 resize-none"
              />
            </div>

            {/* Secondary Landmark */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Secondary Landmark <span className="normal-case tracking-normal font-normal text-zinc-300">(optional)</span></label>
              <input
                type="text"
                value={landmark2}
                onChange={(e) => setLandmark2(e.target.value)}
                placeholder="Above Coffee Shop, Blue Gate..."
                className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 outline-none transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-300"
              />
            </div>
          </div>

          {/* RIGHT: GPS Visualizer */}
          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">GPS Pinpoint</label>
            <div className="flex-1 relative rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200 min-h-[220px]">

              {isMapReady ? (
                <div className="w-full h-[220px] sm:h-full relative">
                  {(isLoaded && !loadError) ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={coords}
                      zoom={15}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: true,
                        styles: [
                          {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                          }
                        ]
                      }}
                      onLoad={onLoad}
                      onUnmount={onUnmount}
                      onClick={(e) => {
                        if (e.latLng) {
                          setCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                        }
                      }}
                    >
                      <MarkerF 
                        position={coords}
                        draggable={true}
                        onDragEnd={(e) => {
                          if (e.latLng) {
                            setCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                          }
                        }}
                      />
                    </GoogleMap>
                  ) : loadError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-zinc-50">
                       <ShieldAlert className="w-6 h-6 text-red-500/50" />
                       <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Map Configuration Error</p>
                       <p className="text-[10px] text-zinc-400 font-medium">Your pinpoint is still saved via GPS coords, but the visual map is currently unavailable.</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-50">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                  )}

                  {/* Coords badge overlay */}
                  <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-sm border border-zinc-100 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-[10px] font-black text-zinc-700 tracking-wider">
                          {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
                        </span>
                      </div>
                      <span className="text-[9px] font-medium text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">Draggable Target</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-200 flex items-center justify-center">
                    <Navigation className="w-6 h-6 text-zinc-400" />
                  </div>
                  <p className="text-xs font-bold text-zinc-400">Enter your 6-digit pincode<br/>to activate GPS mapping.</p>
                </div>
              )}
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 rounded-2xl border border-zinc-100">
              <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-[10px] font-bold text-zinc-400 leading-snug">
                Your location data is only used for your installation appointment and is never sold.
              </span>
            </div>
          </div>
        </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
          <button
            onClick={onClose}
            className="text-xs font-black text-zinc-400 hover:text-zinc-600 uppercase tracking-widest transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className="group flex items-center gap-3 bg-zinc-900 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-[0.2em] px-6 sm:px-8 py-4 rounded-2xl sm:rounded-3xl transition-all shadow-xl shadow-zinc-900/10 hover:shadow-blue-500/20 active:scale-95 touch-manipulation"
          >
            Confirm Site
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}


