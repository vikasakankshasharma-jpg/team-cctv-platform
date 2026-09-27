import pincodeData from "@/data/pincodes.json";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface HubWithCoordinates {
  id: string;
  name: string;
  city_name?: string;
  latitude?: number;
  longitude?: number;
  pincode_coverage?: string[];
  [key: string]: any;
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface using the Haversine formula.
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}

/**
 * Gets coordinates for a 6-digit Indian Pincode by looking up its 3-digit prefix.
 */
export function getPincodeCoordinates(pincode: string): Coordinates | null {
  if (!pincode || pincode.length < 3) return null;
  
  // Use first 3 digits for regional mapping
  const prefix = pincode.substring(0, 3);
  const data = (pincodeData as Record<string, { lat: number, lng: number, city: string }>)[prefix];
  
  if (data) {
    return { lat: data.lat, lng: data.lng };
  }
  
  return null;
}

/**
 * Finds the nearest hub based on exact latitude and longitude.
 * Returns the closest Hub and the distance in kilometers.
 */
export function findNearestHub(customerCoords: Coordinates, activeHubs: HubWithCoordinates[]): { hub: HubWithCoordinates, distanceKm: number } | null {
  if (!activeHubs || activeHubs.length === 0) return null;

  let nearestHub: HubWithCoordinates | null = null;
  let minDistance = Infinity;

  for (const hub of activeHubs) {
    // If hub is missing coordinates, fallback to Jaipur by default or skip
    const hubCoords: Coordinates = {
      lat: hub.latitude || 26.9124, // Default to Jaipur Lat
      lng: hub.longitude || 75.7873 // Default to Jaipur Lng
    };

    const distance = calculateDistance(customerCoords, hubCoords);
    if (distance < minDistance) {
      minDistance = distance;
      nearestHub = hub;
    }
  }

  return nearestHub ? { hub: nearestHub, distanceKm: Math.round(minDistance) } : null;
}

export interface PincodeGroupedData {
  pincode: string;
  areas: string[];
  allAreas: string[];
  lat?: number;
  lng?: number;
  radius: number;
}

export function computeDistrictPincodes(offices: any[]): PincodeGroupedData[] {
  if (!offices || offices.length === 0) return [];

  // Step 1: Determine valid pincode prefixes to remove dataset bleed (outliers from other districts)
  const prefixCounts = new Map<string, number>();
  offices.forEach(o => {
    if (o.pincode && String(o.pincode).length >= 3) {
      const prefix = String(o.pincode).substring(0, 3);
      prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
    }
  });

  let maxCount = 0;
  prefixCounts.forEach(count => { if (count > maxCount) maxCount = count; });
  
  const validPrefixes = new Set<string>();
  prefixCounts.forEach((count, prefix) => {
    // Keep prefixes that represent at least 5% of the primary prefix count
    if (count >= maxCount * 0.05) {
      validPrefixes.add(prefix);
    }
  });

  // Step 2: Group offices by pincode (Discard all dataset coordinates as they are highly inaccurate)
  const pincodeMap = new Map<string, {
    areas: Set<string>;
  }>();

  offices.forEach(o => {
    if (!o.pincode) return;
    const prefix = String(o.pincode).substring(0, 3);
    
    // Ignore pincodes that don't belong to this district's dominant prefixes
    if (validPrefixes.size > 0 && !validPrefixes.has(prefix)) return;

    if (!pincodeMap.has(o.pincode)) {
      pincodeMap.set(o.pincode, { areas: new Set() });
    }
    const group = pincodeMap.get(o.pincode)!;
    const name = o.officeName || o.office;
    if (name) group.areas.add(name);
  });

  // Step 3: Return pincodes without lat/lng to force the frontend to use Google Maps Geocoder for perfect placement
  return Array.from(pincodeMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([pincode, data]) => {
      return {
        pincode,
        areas: Array.from(data.areas).slice(0, 4),
        allAreas: Array.from(data.areas),
        radius: 4000
      };
    });
}
