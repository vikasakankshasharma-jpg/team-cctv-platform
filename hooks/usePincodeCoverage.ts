import { useState, useEffect, useCallback, useRef } from 'react';

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
  const fetchingRef = useRef<Set<string>>(new Set());

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
    if (enrichedPincodes.length === 0) return;
    
    // Find pincodes without coordinates that aren't already being fetched
    const toGeocode = enrichedPincodes.filter(p => (!p.lat || !p.lng) && !fetchingRef.current.has(p.pincode));
    if (toGeocode.length === 0) return;

    toGeocode.forEach(async (p) => {
      fetchingRef.current.add(p.pincode);
      try {
        const res = await fetch(\`/api/pincode/\${p.pincode}\`);
        if (res.ok) {
          const data = await res.json();
          if (data.lat && data.lng) {
            setEnrichedPincodes(prev => prev.map(item => 
              item.pincode === p.pincode 
                ? { ...item, lat: data.lat, lng: data.lng, radius: data.radius || 4000 }
                : item
            ));
          }
        }
      } catch (e) {
        // ignore error
      }
    });
  }, [enrichedPincodes]);

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
