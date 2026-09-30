"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";

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
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchNominatim = async (query: string) => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      // Nominatim free API with country lock to India
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&addressdetails=1&limit=5`, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'CCTVQuotationApp/1.0'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setShowDropdown(true);
      }
    } catch (e) {
      console.warn("Places search failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      searchNominatim(val);
    }, 600); // 600ms debounce
  };

  const handleSelect = (item: any) => {
    setInputValue(item.display_name);
    setShowDropdown(false);
    
    const addr = item.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || "";
    const state = addr.state || "";
    const pincode = addr.postcode || "";
    const street = addr.road || addr.suburb || addr.neighbourhood || addr.residential || "";

    onPlaceSelected({
      full_address: item.display_name,
      street: street || item.display_name.split(",")[0],
      city,
      state,
      pincode,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    });
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Search className="w-4 h-4" />}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
        placeholder={placeholder}
        className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 outline-none transition-all ${className}`}
      />
      
      {showDropdown && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
          {results.map((item, idx) => (
            <li 
              key={item.place_id || idx}
              onClick={() => handleSelect(item)}
              className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-start gap-3 transition-colors"
            >
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-slate-800 truncate">
                  {item.display_name.split(",")[0]}
                </span>
                <span className="text-xs text-slate-500 truncate">
                  {item.display_name.split(",").slice(1).join(",").trim()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
