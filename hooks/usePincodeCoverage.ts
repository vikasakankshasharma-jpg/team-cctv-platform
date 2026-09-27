import { useState, useEffect, useCallback } from 'react';

export interface PincodeData {
  pincode: string;
  areas: string[];
  allAreas?: string[];
  lat?: number;
  lng?: number;
  radius?: number;
}

export function usePincodeCoverage(isLoaded: boolean, inputPincodes: PincodeData[]) {
  const [enrichedPincodes, setEnrichedPincodes] = useState<PincodeData[]>(inputPincodes);

  // Sync state when input changes, preserving existing geocoded data if possible
  useEffect(() => {
    setEnrichedPincodes(prev => {
      const prevMap = new Map(prev.map(p => [p.pincode, p]));
      return inputPincodes.map(p => {
        const existing = prevMap.get(p.pincode);
        if (existing && existing.lat && existing.lng) {
          return { ...p, lat: existing.lat, lng: existing.lng, radius: existing.radius };
        }
        return p;
      });
    });
  }, [inputPincodes]);

  // Auto-geocode pincodes that are strictly missing lat/lng
  useEffect(() => {
    if (!isLoaded || enrichedPincodes.length === 0) return;
    
    // Find pincodes without coordinates
    const toGeocode = enrichedPincodes.filter(p => !p.lat || !p.lng);
    if (toGeocode.length === 0) return;

    let delay = 0;
    const geocoder = new window.google.maps.Geocoder();

    toGeocode.forEach((p) => {
      setTimeout(() => {
        try {
          // Geocode with postalCode and country restriction for precision
          geocoder.geocode({ 
            address: `${p.pincode}, India`,
            componentRestrictions: { postalCode: p.pincode, country: 'IN' }
          }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              const loc = results[0].geometry.location;
              setEnrichedPincodes(prev => prev.map(item => 
                item.pincode === p.pincode 
                  ? { ...item, lat: loc.lat(), lng: loc.lng(), radius: item.radius || 4000 }
                  : item
              ));
            }
          });
        } catch (e) {
          // ignore error
        }
      }, delay);
      
      delay += 75; // 75ms allows ~13 req/s, well within Google's 50 req/s limit
    });
  }, [enrichedPincodes, isLoaded]);

  // Returns all pincodes whose radius overlaps with the given coordinate
  const getOverlappingPincodes = useCallback((lat: number, lng: number): string[] => {
    const overlapping: string[] = [];
    enrichedPincodes.forEach(p => {
      if (p.lat && p.lng) {
        // Simple euclidean distance for map proximity
        const dLat = p.lat - lat;
        const dLng = p.lng - lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        // Add if within true radius (approx converted to degrees)
        const radiusInDegrees = (p.radius || 4000) / 111000;
        if (dist < radiusInDegrees) {
          overlapping.push(p.pincode);
        }
      }
    });
    return overlapping;
  }, [enrichedPincodes]);

  return { 
    enrichedPincodes,
    getOverlappingPincodes
  };
}
