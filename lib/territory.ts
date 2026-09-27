import { Address, Installer, Salesperson, CoverageZone } from "@/types";
import { adminDb } from "@/lib/firebase-admin";

// Haversine formula to calculate distance between two coordinates in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

type PartnerWithTerritory = Salesperson | Installer;

/**
 * Evaluates a list of partners against a lead's address.
 * Returns an array of partner IDs who are eligible to handle the lead.
 */
export async function findEligiblePartners(leadAddress: Address, partners: PartnerWithTerritory[]): Promise<string[]> {
  if (!leadAddress || !partners || partners.length === 0) return [];
  
  const eligibleIds: string[] = [];
  const leadPincode = leadAddress.pincode?.trim();

  // Ensure leadAddress has coordinates if missing
  if (!leadAddress.coordinates?.lat || !leadAddress.coordinates?.lng) {
    if (leadPincode) {
      try {
        const cacheSnap = await adminDb.collection("pincode_cache").doc(leadPincode).get();
        if (cacheSnap.exists) {
          const data = cacheSnap.data();
          if (data?.lat && data?.lng) {
            leadAddress.coordinates = { lat: data.lat, lng: data.lng };
          }
        }
      } catch (err) {
         console.error("[Territory] Error fetching pincode cache:", err);
      }
      
      // Fallback to static mapping if still missing
      if (!leadAddress.coordinates?.lat || !leadAddress.coordinates?.lng) {
         const { getPincodeCoordinates } = await import("@/lib/geo-utils");
         const fallbackCoords = getPincodeCoordinates(leadPincode);
         if (fallbackCoords) {
           leadAddress.coordinates = fallbackCoords;
         }
      }
    }
  }
  
  // Cache all coverage zones for the intelligent radius overlap check
  let allZones: CoverageZone[] = [];
  try {
    const zonesSnap = await adminDb.collection("coverage_zones").get();
    allZones = zonesSnap.docs.map(d => ({ id: d.id, ...d.data() } as CoverageZone));
  } catch (err) {
    console.error("[Territory] Failed to fetch coverage zones", err);
  }

  for (const partner of partners) {
    if (!partner.is_active || !partner.id) continue;
    
    // Default to false unless proven eligible
    let isEligible = false;
    const territory = partner.territory;
    
    if (!territory) {
        const legacySalesperson = partner as Salesperson;
        const legacyInstaller = partner as Installer;
        
        // 1. Check legacy arrays
        if (legacySalesperson.assigned_pincodes?.includes(leadPincode)) isEligible = true;
        if (!isEligible && legacyInstaller.serviceable_pincodes?.includes(leadPincode)) isEligible = true;
        
        // 2. Check Coverage Zones (New Overlapping Radius Logic)
        if (!isEligible && legacySalesperson.assigned_zone_ids && legacySalesperson.assigned_zone_ids.length > 0) {
          for (const zoneId of legacySalesperson.assigned_zone_ids) {
            const zone = allZones.find(z => z.id === zoneId);
            if (zone) {
              // Exact pincode match or sub-office match in zone
              let zoneHasRestrictedSubOffices = false;
              let subOfficeMatched = false;

              if (leadPincode && zone.pincodes) {
                for (const code of zone.pincodes) {
                  if (code === leadPincode) {
                    isEligible = true;
                    break;
                  } else if (code.startsWith(`${leadPincode}:`)) {
                    zoneHasRestrictedSubOffices = true;
                    const specificArea = code.split(':')[1];
                    const addressText = leadAddress.full_address?.toLowerCase() || "";
                    if (addressText.includes(specificArea.toLowerCase())) {
                      isEligible = true;
                      subOfficeMatched = true;
                      break;
                    }
                  }
                }
              }

              if (isEligible) break;
              
              // Intelligent radius overlap match (only apply if we haven't strictly restricted to a different sub-office)
              if (!isEligible && !zoneHasRestrictedSubOffices && zone.pincodes_data && leadAddress.coordinates?.lat && leadAddress.coordinates?.lng) {
                for (const pData of zone.pincodes_data) {
                  if (pData.lat && pData.lng && pData.radius) {
                    const distanceKm = calculateDistanceKm(
                      leadAddress.coordinates.lat, leadAddress.coordinates.lng,
                      pData.lat, pData.lng
                    );
                    // Radius is in meters, convert to km
                    if (distanceKm <= (pData.radius / 1000)) {
                      isEligible = true;
                      break;
                    }
                  }
                }
              }
            }
            if (isEligible) break;
          }
        }
        
        if (isEligible) {
            eligibleIds.push(partner.id);
        }
        continue;
    }

    // 1. Strict Pincode Match
    if (territory.allowed_pincodes && territory.allowed_pincodes.length > 0) {
      if (leadPincode && territory.allowed_pincodes.includes(leadPincode)) {
        isEligible = true;
      }
    }

    // 2. City Match
    if (!isEligible && territory.allowed_cities && territory.allowed_cities.length > 0) {
      const addressText = leadAddress.full_address?.toLowerCase() || "";
      for (const city of territory.allowed_cities) {
        if (addressText.includes(city.toLowerCase().trim())) {
          isEligible = true;
          break;
        }
      }
    }

    // 3. Radius Match (Partner's own center radius)
    if (!isEligible && territory.operating_radius_km && territory.base_coordinates) {
      if (leadAddress.coordinates && leadAddress.coordinates.lat && leadAddress.coordinates.lng) {
        const distance = calculateDistanceKm(
          leadAddress.coordinates.lat,
          leadAddress.coordinates.lng,
          territory.base_coordinates.lat,
          territory.base_coordinates.lng
        );
        if (distance <= territory.operating_radius_km) {
          isEligible = true;
        }
      }
    }

    if (isEligible) {
      eligibleIds.push(partner.id);
    }
  }

  return eligibleIds;
}

