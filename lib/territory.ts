import { Address, Installer, Salesperson } from "@/types";

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
export function findEligiblePartners(leadAddress: Address, partners: PartnerWithTerritory[]): string[] {
  if (!leadAddress || !partners || partners.length === 0) return [];
  
  const eligibleIds: string[] = [];
  const leadPincode = leadAddress.pincode?.trim();
  // Extract city/state if available (often stored in full_address or landmark, but pincode/coords is most reliable)
  // For precise matching, we assume pincode or coordinates are primary.

  for (const partner of partners) {
    if (!partner.is_active || !partner.id) continue;
    
    // Default to false unless proven eligible
    let isEligible = false;
    const territory = partner.territory;
    
    if (!territory) {
        // If they have NO territory set, they technically don't cover anywhere in strict mode.
        // Or we could fallback to legacy arrays if they exist on the object
        const legacySalesperson = partner as Salesperson;
        const legacyInstaller = partner as Installer;
        
        if (legacySalesperson.assigned_pincodes?.includes(leadPincode)) isEligible = true;
        if (!isEligible && legacyInstaller.serviceable_pincodes?.includes(leadPincode)) isEligible = true;
        
        if (isEligible) {
            eligibleIds.push(partner.id);
        }
        continue;
    }

    // 1. Strict Pincode Match
    if (territory.allowed_pincodes && territory.allowed_pincodes.length > 0) {
      if (territory.allowed_pincodes.includes(leadPincode)) {
        isEligible = true;
      }
    }

    // 2. City Match (Regex against full_address if needed, or explicitly if we parse city)
    // For now, if city is listed in their allowed_cities, and lead's full address contains it.
    if (!isEligible && territory.allowed_cities && territory.allowed_cities.length > 0) {
      const addressText = leadAddress.full_address?.toLowerCase() || "";
      for (const city of territory.allowed_cities) {
        if (addressText.includes(city.toLowerCase().trim())) {
          isEligible = true;
          break;
        }
      }
    }

    // 3. Radius Match
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
