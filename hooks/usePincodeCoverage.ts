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

  // Auto-geocode pincodes that are missing lat/lng or need advanced radius calculation
  useEffect(() => {
    if (!isLoaded || enrichedPincodes.length === 0) return;
    
    // Find pincodes without coordinates or with default radius
    const toGeocode = enrichedPincodes.filter(p => !p.lat || !p.lng || !p.radius || p.radius === 4000);
    if (toGeocode.length === 0) return;

    let delay = 0;
    const geocoder = new window.google.maps.Geocoder();

    toGeocode.forEach((p) => {
      setTimeout(async () => {
        try {
          const allAreas = p.allAreas || p.areas;
          const points: { lat: number; lng: number }[] = [];
          
          // Geocode all sub-areas of this pincode concurrently
          await Promise.all(allAreas.map(area => new Promise<void>((resolve) => {
            geocoder.geocode({ address: `${area}, ${p.pincode}, India` }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                points.push({
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng()
                });
              }
              resolve(); // Resolve even on failure to avoid hanging
            });
          })));

          if (points.length === 0) {
            // Fallback to just the pincode
            geocoder.geocode({ address: `${p.pincode}, India` }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                 setEnrichedPincodes(prev => prev.map(item => 
                   item.pincode === p.pincode 
                     ? { ...item, lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng(), radius: 4001 }
                     : item
                 ));
              }
            });
            return;
          }

          // Calculate Centroid
          const centroidLat = points.reduce((sum, pt) => sum + pt.lat, 0) / points.length;
          const centroidLng = points.reduce((sum, pt) => sum + pt.lng, 0) / points.length;

          // Calculate max radius from centroid
          let maxRadius = 0; // in meters
          points.forEach(pt => {
            const R = 6371e3; // Earth radius in meters
            const lat1 = centroidLat * Math.PI/180;
            const lat2 = pt.lat * Math.PI/180;
            const dLat = (pt.lat - centroidLat) * Math.PI/180;
            const dLng = (pt.lng - centroidLng) * Math.PI/180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1) * Math.cos(lat2) *
                      Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            if (distance > maxRadius) maxRadius = distance;
          });

          // Ensure minimum radius of 2km just in case points are very close, and add 1km buffer to maxRadius
          const finalRadius = Math.max(maxRadius + 1000, 2000);

          setEnrichedPincodes(prev => prev.map(item => 
            item.pincode === p.pincode 
              ? { ...item, lat: centroidLat, lng: centroidLng, radius: finalRadius }
              : item
          ));
        } catch (e) {
          // ignore error
        }
      }, delay);
      
      // Throttle strictly (wait 800ms between each pincode processing)
      delay += 800;
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
