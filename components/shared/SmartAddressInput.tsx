"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Loader2, 
  Compass, 
  AlertCircle 
} from "lucide-react";
import { LocationPickerModal, LocationMeta } from "@/components/checkout/LocationPickerModal";

export interface QuadrantInfo {
  zone: string;
  anchor: string;
  coverage: string;
}

export interface SmartAddressData {
  pincode: string;
  district?: string;
  state?: string;
  quadrant?: string;
  anchor?: string;
  streetAddress?: string;
  lat?: number;
  lng?: number;
}

interface SmartAddressInputProps {
  mode?: "compact" | "full" | "survey";
  pincode: string;
  onPincodeChange: (pin: string) => void;
  selectedQuadrant?: string;
  onQuadrantChange?: (quadrant: string, meta?: { anchor?: string; lat?: number; lng?: number }) => void;
  streetAddress?: string;
  onStreetAddressChange?: (address: string) => void;
  accentColor?: string; // e.g. '#9b8cff' or 'blue-600'
  required?: boolean;
  disabled?: boolean;
  className?: string;
  allowMapSelection?: boolean;
  initialCoords?: { lat?: number; lng?: number };
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
}

export function SmartAddressInput({
  mode = "compact",
  pincode,
  onPincodeChange,
  selectedQuadrant,
  onQuadrantChange,
  streetAddress = "",
  onStreetAddressChange,
  accentColor = "#9b8cff",
  required = false,
  disabled = false,
  className = "",
  allowMapSelection = true,
  initialCoords,
  onCoordinatesChange,
}: SmartAddressInputProps) {
  const [loading, setLoading] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [pinnedCoords, setPinnedCoords] = useState<{ lat?: number; lng?: number } | undefined>(initialCoords);

  useEffect(() => {
    if (initialCoords?.lat && initialCoords?.lng) {
      setPinnedCoords(initialCoords);
    }
  }, [initialCoords?.lat, initialCoords?.lng]);
  const [geoInfo, setGeoInfo] = useState<{
    district?: string;
    state?: string;
    quadrants?: QuadrantInfo[];
    lat?: number;
    lng?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const lastFetchedPin = useRef<string>("");

  // Auto-resolve when pincode reaches 6 digits
  useEffect(() => {
    const cleanPin = pincode.replace(/\D/g, "");
    if (cleanPin.length === 6) {
      if (lastFetchedPin.current === cleanPin) return;
      lastFetchedPin.current = cleanPin;
      setLoading(true);
      setError(null);

      fetch(`/api/pincode/${cleanPin}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("Pincode lookup failed");
          return res.json();
        })
        .then((data) => {
          setGeoInfo({
            district: data.district || data.city,
            state: data.state,
            quadrants: data.quadrants || [],
            lat: data.lat,
            lng: data.lng,
          });

          // If quadrant is already selected or we have default coords, propagate them
          if (data.lat && data.lng && onQuadrantChange && !selectedQuadrant) {
            // default lat/lng
          }
        })
        .catch((err) => {
          console.warn("Pincode API failed:", err);
          setError("Could not resolve location details for this PIN.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      if (cleanPin.length === 0) {
        setGeoInfo(null);
        setError(null);
        lastFetchedPin.current = "";
      }
    }
  }, [pincode, onQuadrantChange, selectedQuadrant]);

  // GPS Current Location Grabber
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by this browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPinnedCoords({ lat: latitude, lng: longitude });
        if (onCoordinatesChange) {
          onCoordinatesChange({ lat: latitude, lng: longitude });
        }
        try {
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          if (res.ok) {
            const data = await res.json();
            const foundPin = data.address?.postcode?.replace(/\D/g, "");
            if (foundPin && foundPin.length === 6) {
              onPincodeChange(foundPin);
            }
            if (onStreetAddressChange && !streetAddress) {
              const road = data.address?.road || data.address?.suburb || "";
              if (road) onStreetAddressChange(road);
            }
          }
        } catch (_) {
          // ignore reverse geocode error
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setError("Location permission denied. Please enter PINCODE manually or use Select on Map.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Map Pinpoint Confirmation
  const handleMapConfirm = (coords: { lat: number; lng: number }, mapUrl: string, meta?: LocationMeta) => {
    setPinnedCoords(coords);
    if (onCoordinatesChange) {
      onCoordinatesChange(coords);
    }

    if (meta?.pincode && meta.pincode.length === 6) {
      onPincodeChange(meta.pincode);
    }

    if (meta?.formattedAddress && onStreetAddressChange && !streetAddress) {
      onStreetAddressChange(meta.formattedAddress);
    }

    if (onQuadrantChange) {
      onQuadrantChange(selectedQuadrant || meta?.locality || "Pinned Location", {
        anchor: meta?.locality || "Map Pinpoint",
        lat: coords.lat,
        lng: coords.lng,
      });
    }
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Pincode & City/State badge row */}
      <div>
        <div className="flex items-center justify-between mb-1 gap-2">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300">
            PINCODE {required && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {allowMapSelection && (
              <button
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                disabled={disabled}
                className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/80 px-2 sm:px-2.5 py-0.5 rounded-full transition-all active:scale-95 shadow-2xs"
              >
                <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{pinnedCoords?.lat ? "Change Map Pin" : "Select on Map"}</span>
              </button>
            )}
            {mode !== "compact" && (
              <button
                type="button"
                onClick={handleUseCurrentGPS}
                disabled={gpsLoading || disabled}
                className="text-[11px] text-slate-600 hover:text-slate-900 dark:text-zinc-400 font-bold flex items-center gap-1 transition-colors hover:underline disabled:opacity-50"
              >
                {gpsLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Navigation className="w-3 h-3" />
                )}
                <span>{gpsLoading ? "GPS..." : "Use GPS"}</span>
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            disabled={disabled}
            placeholder="e.g. 302001"
            value={pincode}
            onChange={(e) => onPincodeChange(e.target.value.replace(/\D/g, ""))}
            className="w-full py-2.5 px-3.5 sm:p-3 text-sm border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#9b8cff] focus:border-[#9b8cff] outline-none transition-all bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
          />

          {loading ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Checking...</span>
            </div>
          ) : geoInfo?.district ? (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{geoInfo.district}, {geoInfo.state}</span>
            </div>
          ) : null}
        </div>

        {error && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}

        {/* Pinned Coordinates Confirmation Badge */}
        {pinnedCoords?.lat && pinnedCoords?.lng && (
          <div className="mt-2 flex items-center justify-between bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold text-[11px] truncate">
                Exact Location Pinned ({pinnedCoords.lat.toFixed(4)}°N, {pinnedCoords.lng.toFixed(4)}°E)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 ml-2"
            >
              Edit Pin
            </button>
          </div>
        )}
      </div>

      {/* Delivery Hub / Area Selector Chips */}
      {geoInfo?.quadrants && geoInfo.quadrants.length > 0 && (
        <div className="animate-in slide-in-from-top-1 duration-200 space-y-1.5 bg-slate-50/70 dark:bg-zinc-900/50 p-2.5 sm:p-3 rounded-2xl border border-slate-200/70 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#9b8cff]" /> Select Your Local Area / Delivery Hub
            </label>
            <span className="text-[10px] text-muted-foreground">Helps assign nearest technician</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {geoInfo.quadrants.map((q) => {
              const isSelected = selectedQuadrant === q.zone || selectedQuadrant?.startsWith(q.zone);
              return (
                <button
                  key={q.zone}
                  type="button"
                  onClick={() => {
                    if (onQuadrantChange) {
                      onQuadrantChange(q.zone, {
                        anchor: q.anchor,
                        lat: geoInfo.lat,
                        lng: geoInfo.lng,
                      });
                    }
                  }}
                  className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#9b8cff]/15 border-[#9b8cff] text-slate-900 dark:text-white shadow-sm ring-1 ring-[#9b8cff]"
                      : "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-[#9b8cff]/50 text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold leading-tight">
                      {q.zone} {q.anchor && q.anchor !== q.zone && (
                        <span className="text-[11px] font-semibold text-slate-500">({q.anchor})</span>
                      )}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#9b8cff] shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate mt-1 leading-normal" title={q.coverage}>
                    {q.coverage}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Street Address Input (in survey or full mode) */}
      {(mode === "full" || mode === "survey") && (
        <div className="animate-in fade-in duration-200">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">
            Flat / House No., Building or Street Name {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              required={required}
              disabled={disabled}
              placeholder="e.g. Flat 302, Royal Residency, MI Road"
              value={streetAddress}
              onChange={(e) => onStreetAddressChange && onStreetAddressChange(e.target.value)}
              className="w-full py-2.5 pl-9 pr-3.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#9b8cff] focus:border-[#9b8cff] outline-none transition-all bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Interactive Map Modal */}
      {allowMapSelection && (
        <LocationPickerModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          initialPincode={pincode || "302001"}
          initialCoords={
            pinnedCoords?.lat && pinnedCoords?.lng
              ? { lat: pinnedCoords.lat, lng: pinnedCoords.lng }
              : undefined
          }
          onConfirm={handleMapConfirm}
        />
      )}
    </div>
  );
}
