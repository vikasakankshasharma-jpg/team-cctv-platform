/**
 * Universal Route Optimization Engine
 * Implements Time-Window-Aware Hybrid Traveling Salesperson Problem (VRPTW Heuristic)
 * 
 * 1. Partitions stops by Time Slot (Morning -> Afternoon -> Evening)
 * 2. Minimizes driving distance (Haversine) within each slot window
 * 3. Smoothly chains transit from the last stop of window N to the first stop of window N+1
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface OptimizableStop {
  id: string;
  coordinates?: LatLng | null;
  time_slot?: "morning" | "afternoon" | "evening" | string;
  route_order?: number;
  [key: string]: any;
}

export interface OptimizationResult<T extends OptimizableStop> {
  optimizedStops: T[];
  totalDistanceKm: number;
  estimatedDriveMinutes: number;
  legDistancesKm: number[];
}

/**
 * Calculates Great-Circle / Haversine distance between two coordinates in kilometers.
 */
export function calculateHaversineKm(p1: LatLng, p2: LatLng): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Time Slot priority order and standard city driving constants
 */
export const TIME_SLOT_ORDER: Record<string, number> = {
  morning: 1,
  afternoon: 2,
  evening: 3,
};

const AVG_URBAN_SPEED_KMH = 25; // Average city driving speed in km/h

/**
 * Optimizes a list of stops considering both Time-Window constraints and shortest driving distance.
 */
export function optimizeRouteWithTimeWindows<T extends OptimizableStop>(
  stops: T[],
  origin?: LatLng | null
): OptimizationResult<T> {
  if (stops.length <= 1) {
    return {
      optimizedStops: stops.map((s, idx) => ({ ...s, route_order: idx + 1 })),
      totalDistanceKm: 0,
      estimatedDriveMinutes: 0,
      legDistancesKm: [],
    };
  }

  // Split stops into those with coordinates and those without
  const validStops = stops.filter(
    (s) => s.coordinates && typeof s.coordinates.lat === "number" && typeof s.coordinates.lng === "number"
  );
  const invalidStops = stops.filter(
    (s) => !s.coordinates || typeof s.coordinates.lat !== "number" || typeof s.coordinates.lng !== "number"
  );

  // Group valid stops by time slot
  const slotBuckets: Record<string, T[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  validStops.forEach((stop) => {
    const slot = (stop.time_slot || "morning").toLowerCase();
    if (slotBuckets[slot]) {
      slotBuckets[slot].push(stop);
    } else {
      slotBuckets.morning.push(stop);
    }
  });

  const orderedStops: T[] = [];
  const legDistances: number[] = [];
  let currentPoint: LatLng | null = origin || null;

  // Process each slot chronologically
  const slots: Array<"morning" | "afternoon" | "evening"> = ["morning", "afternoon", "evening"];

  for (const slot of slots) {
    const bucket = [...slotBuckets[slot]];

    while (bucket.length > 0) {
      if (!currentPoint) {
        // If no origin, start with the first item in the bucket
        const first = bucket.shift()!;
        orderedStops.push(first);
        currentPoint = first.coordinates!;
        continue;
      }

      // Find nearest neighbor in current bucket
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < bucket.length; i++) {
        const dist = calculateHaversineKm(currentPoint, bucket[i].coordinates!);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      const [nextStop] = bucket.splice(nearestIdx, 1);
      legDistances.push(minDistance);
      orderedStops.push(nextStop);
      currentPoint = nextStop.coordinates!;
    }
  }

  // Append any stops without coordinates at the very end
  const finalStops = [...orderedStops, ...invalidStops].map((s, idx) => ({
    ...s,
    route_order: idx + 1,
  }));

  const totalDistanceKm = legDistances.reduce((acc, d) => acc + d, 0);
  const estimatedDriveMinutes = Math.round((totalDistanceKm / AVG_URBAN_SPEED_KMH) * 60);

  return {
    optimizedStops: finalStops,
    totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    estimatedDriveMinutes,
    legDistancesKm: legDistances.map((d) => Number(d.toFixed(2))),
  };
}

/**
 * Builds Google Maps Multi-Stop Navigation URL
 */
export function buildGoogleMapsMultiStopUrl(
  stops: Array<{ coordinates?: LatLng | null }>,
  origin?: LatLng | null
): string | null {
  const validStops = stops.filter(
    (s) => s.coordinates && typeof s.coordinates.lat === "number" && typeof s.coordinates.lng === "number"
  );

  if (validStops.length === 0) return null;

  const originParam = origin ? `origin=${origin.lat},${origin.lng}&` : "";

  if (validStops.length === 1 && !origin) {
    const c = validStops[0].coordinates!;
    return `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;
  }

  const destination = validStops[validStops.length - 1].coordinates!;
  const waypoints = validStops
    .slice(0, validStops.length - 1)
    .map((s) => `${s.coordinates!.lat},${s.coordinates!.lng}`)
    .join("|");

  return `https://www.google.com/maps/dir/?api=1&${originParam}destination=${destination.lat},${destination.lng}${
    waypoints ? `&waypoints=${waypoints}` : ""
  }`;
}
