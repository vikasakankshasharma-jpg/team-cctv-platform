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
  lat: number;
  lng: number;
  radius: number;
}

/**
 * Robustly computes verified local coordinates for all pincodes in a district dataset,
 * eliminating mis-scraped outlier coordinates from third-party postal datasets
 * (which often place pincodes in other states or across borders).
 */
export function computeDistrictPincodes(offices: any[]): PincodeGroupedData[] {
  if (!offices || offices.length === 0) return [];

  // Step 1: Filter candidate offices that have valid India coordinates (lat: 8-37, lng: 68-98)
  const candidateOffices = offices.filter(o => 
    typeof o.latitude === 'number' && typeof o.longitude === 'number' &&
    o.latitude >= 8.0 && o.latitude <= 37.0 &&
    o.longitude >= 68.0 && o.longitude <= 98.0
  );

  // Step 2: Compute district median center from candidate offices
  let medianLat = 26.9124;
  let medianLng = 75.7873;
  if (candidateOffices.length > 0) {
    const sortedLats = [...candidateOffices.map(o => o.latitude)].sort((a, b) => a - b);
    const sortedLngs = [...candidateOffices.map(o => o.longitude)].sort((a, b) => a - b);
    medianLat = sortedLats[Math.floor(sortedLats.length / 2)];
    medianLng = sortedLngs[Math.floor(sortedLngs.length / 2)];
  }

  // Step 3: Threshold for local district coordinates: within ~100km of district median
  const isWithinDistrict = (lat: number, lng: number) => {
    return Math.abs(lat - medianLat) <= 1.0 && Math.abs(lng - medianLng) <= 1.0;
  };

  // Step 4: Group offices by pincode
  const pincodeMap = new Map<string, {
    areas: Set<string>;
    validCoords: { lat: number; lng: number; isMain: boolean }[];
  }>();

  offices.forEach(o => {
    if (!o.pincode) return;
    if (!pincodeMap.has(o.pincode)) {
      pincodeMap.set(o.pincode, { areas: new Set(), validCoords: [] });
    }
    const group = pincodeMap.get(o.pincode)!;
    const name = o.officeName || o.office;
    if (name) group.areas.add(name);

    if (
      typeof o.latitude === 'number' && 
      typeof o.longitude === 'number' &&
      isWithinDistrict(o.latitude, o.longitude)
    ) {
      const isMain = o.officeType === 'HO' || o.officeType === 'SO' || 
        (name && /H\.?O|S\.?O|G\.?P\.?O/i.test(name));
      group.validCoords.push({ lat: o.latitude, lng: o.longitude, isMain: !!isMain });
    }
  });

  // Step 5: Assign best verified coordinates for each pincode
  return Array.from(pincodeMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([pincode, data]) => {
      let lat = medianLat;
      let lng = medianLng;

      if (data.validCoords.length > 0) {
        // Prefer main post office (Head Office / Sub-Office)
        const mainCoord = data.validCoords.find(c => c.isMain);
        if (mainCoord) {
          lat = mainCoord.lat;
          lng = mainCoord.lng;
        } else {
          // Average of valid local coordinates
          lat = data.validCoords.reduce((sum, c) => sum + c.lat, 0) / data.validCoords.length;
          lng = data.validCoords.reduce((sum, c) => sum + c.lng, 0) / data.validCoords.length;
        }
      }

      return {
        pincode,
        areas: Array.from(data.areas).slice(0, 4),
        allAreas: Array.from(data.areas),
        lat,
        lng,
        radius: 4000
      };
    });
}
