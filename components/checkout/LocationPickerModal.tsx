"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  Loader2, 
  Compass, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import HybridMap from "../maps/HybridMap";
import { getPincodeCoordinates, Coordinates } from "@/lib/geo-utils";
import { toast } from "sonner";

export interface LocationMeta {
  pincode?: string;
  locality?: string;
  formattedAddress?: string;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (coords: Coordinates, googleMapsLink: string, meta?: LocationMeta) => void;
  initialPincode?: string;
  initialCoords?: Coordinates;
  addressContext?: string;
}

const DEFAULT_COORDS: Coordinates = { lat: 26.9124, lng: 75.7873 }; // Jaipur Center

export function LocationPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialPincode = "",
  initialCoords,
  addressContext = ""
}: LocationPickerModalProps) {
  const [coords, setCoords] = useState<Coordinates>(() => {
    if (initialCoords && initialCoords.lat && initialCoords.lng) {
      return initialCoords;
    }
    const pinCoords = getPincodeCoordinates(initialPincode);
    return pinCoords || DEFAULT_COORDS;
  });

  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [pincodeResolved, setPincodeResolved] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<LocationMeta | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  // When modal opens, center on Pincode if provided and no prior coords set
  useEffect(() => {
    if (isOpen) {
      if (initialCoords && initialCoords.lat && initialCoords.lng) {
        setCoords(initialCoords);
        setPincodeResolved(true);
      } else if (initialPincode && initialPincode.length >= 3) {
        if (initialPincode.length === 6) {
          // Try internal pincode API first
          fetch(`/api/pincode/${initialPincode}`)
            .then(res => res.json())
            .then(data => {
              if (data && data.lat && data.lng) {
                setCoords({ lat: Number(data.lat), lng: Number(data.lng) });
                setPincodeResolved(true);
              } else {
                throw new Error("No coordinates");
              }
            })
            .catch(() => {
              const pinCoords = getPincodeCoordinates(initialPincode);
              if (pinCoords) {
                setCoords(pinCoords);
                setPincodeResolved(true);
              } else {
                setCoords(DEFAULT_COORDS);
                setPincodeResolved(false);
              }
            });
        } else {
          // Fallback to coarse 3-digit mapping
          const pinCoords = getPincodeCoordinates(initialPincode);
          if (pinCoords) {
            setCoords(pinCoords);
            setPincodeResolved(true);
          } else {
            setCoords(DEFAULT_COORDS);
            setPincodeResolved(false);
          }
        }
      }
    }
  }, [isOpen, initialPincode, initialCoords]);

  // One-click GPS Location Grabber
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGPS(false);
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCoords(newCoords);
        toast.success("Locked to your current GPS location!");
      },
      (error) => {
        setIsLocatingGPS(false);
        console.warn("GPS error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please allow location access or drag the map pin.");
        } else {
          toast.error("Unable to retrieve GPS coordinates. Please drag the pin on map.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Live reverse geocode when coordinates change
  useEffect(() => {
    if (!coords || !coords.lat || !coords.lng) return;
    setIsResolvingAddress(true);
    const timer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.address) {
            const pin = (data.address.postcode || "").replace(/\D/g, "");
            const locality = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.city_district || "";
            const road = [data.address.house_number, data.address.road].filter(Boolean).join(" ");
            const shortAddr = [road, locality].filter(Boolean).join(", ") || data.display_name?.split(", ").slice(0, 3).join(", ") || "";
            setResolvedAddress({
              pincode: pin.length === 6 ? pin : undefined,
              locality,
              formattedAddress: shortAddr,
            });
          }
        })
        .catch(err => console.warn("Reverse geocode failed:", err))
        .finally(() => setIsResolvingAddress(false));
    }, 450);

    return () => clearTimeout(timer);
  }, [coords]);

  const handleConfirmLocation = () => {
    const googleMapsUrl = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    onConfirm(coords, googleMapsUrl, resolvedAddress || undefined);
    toast.success("Installation location pinned successfully!");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Pin Your Installation Location</h3>
                <p className="text-[11px] text-slate-300">
                  {initialPincode ? `Default centered on PIN: ${initialPincode}` : "Drag pin to your exact building or gate"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Helper Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                {initialPincode ? (
                  <>Referred from Pincode: <strong>{initialPincode}</strong></>
                ) : (
                  "Drag pin to pinpoint entrance"
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={handleUseCurrentGPS}
              disabled={isLocatingGPS}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-[11px] shadow-xs active:scale-95 transition-all disabled:opacity-50"
            >
              {isLocatingGPS ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Locating...
                </>
              ) : (
                <>
                  <Crosshair className="w-3 h-3" /> Use My Current GPS
                </>
              )}
            </button>
          </div>

          {/* Interactive Map Canvas */}
          <div className="relative w-full h-[320px] sm:h-[380px] bg-slate-100">
            <HybridMap
              center={coords}
              zoom={16}
              onClick={(lat, lng) => setCoords({ lat, lng })}
              markers={[
                {
                  id: "user-location",
                  lat: coords.lat,
                  lng: coords.lng,
                  draggable: true,
                  onDragEnd: (lat, lng) => setCoords({ lat, lng }),
                }
              ]}
            />

            {/* Float Badge with Coordinates */}
            <div className="absolute bottom-3 left-3 right-3 pointer-events-none z-10">
              <div className="bg-white/95 backdrop-blur-md rounded-xl p-2.5 shadow-md border border-slate-200/80 flex items-center justify-between text-xs pointer-events-auto">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="font-mono font-bold text-slate-800 text-[11px] truncate">
                    {coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°E
                  </span>
                </div>
                <a
                  href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 shrink-0 ml-2"
                >
                  <span>Preview</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {/* Resolved address display */}
            {(resolvedAddress?.formattedAddress || isResolvingAddress) && (
              <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate font-medium text-[11px] sm:text-xs">
                    {isResolvingAddress ? "Detecting area & address..." : resolvedAddress?.formattedAddress}
                  </span>
                </div>
                {resolvedAddress?.pincode && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md shrink-0 ml-2">
                    PIN: {resolvedAddress.pincode}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmLocation}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm This Pinpoint</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
