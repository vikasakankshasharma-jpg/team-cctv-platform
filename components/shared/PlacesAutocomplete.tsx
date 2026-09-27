"use client";

import React, { useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { MapPin } from "lucide-react";

export interface PlaceResult {
  full_address: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

interface PlacesAutocompleteProps {
  onPlaceSelected: (place: PlaceResult) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export function PlacesAutocomplete({
  onPlaceSelected,
  defaultValue = "",
  placeholder = "Search for an address...",
  className = ""
}: PlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-places',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"]
  });

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;
    
    // Check if google maps is available
    if (typeof window.google === 'undefined') return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry", "address_components"],
      componentRestrictions: { country: "in" } // Restrict to India if appropriate
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        return;
      }

      const addressComponents = place.address_components || [];
      
      let street = "";
      let city = "";
      let state = "";
      let pincode = "";

      for (const component of addressComponents) {
        const types = component.types;
        if (types.includes("route") || types.includes("sublocality")) {
          street += (street ? ", " : "") + component.long_name;
        }
        if (types.includes("locality")) {
          city = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          state = component.long_name;
        }
        if (types.includes("postal_code")) {
          pincode = component.long_name;
        }
      }
      
      const formatted = place.formatted_address || "";
      setInputValue(formatted);
      
      onPlaceSelected({
        full_address: formatted,
        street: street || formatted.split(",")[0],
        city,
        state,
        pincode,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      });
    });

  }, [isLoaded, onPlaceSelected]);

  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
        <MapPin className="w-4 h-4" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 outline-none transition-all ${className}`}
      />
    </div>
  );
}
