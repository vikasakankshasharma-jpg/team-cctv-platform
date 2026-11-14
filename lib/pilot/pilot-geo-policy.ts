/**
 * @file lib/pilot/pilot-geo-policy.ts
 * @description Phase 7.4 Service-Area Eligibility Guard (Jaipur Pilot Policy V1).
 * Defines the explicit governed allowlist of serviceable urban pincodes.
 * NOTE: This is a service-area eligibility guard, not physical geo-location verification.
 */

export const PILOT_GEO_POLICY_V1 = Object.freeze({
  policyVersion: "PILOT_GEO_POLICY_V1",
  region: "Jaipur Urban",
  effectiveDate: "2026-11-14",
  serviceDescription: "Controlled Jaipur Urban CCTV Installation Pilot",
});

/**
 * Explicit Governed Allowlist for Jaipur Controlled Pilot.
 * Avoids fragile mathematical numeric ranges.
 */
export const JAIPUR_PILOT_PINCODES: readonly string[] = Object.freeze([
  "302001", // M.I. Road, C-Scheme, Pink City
  "302002", // Tripolia Bazar
  "302003", // Ramganj Bazar
  "302004", // Adarsh Nagar, Tilak Nagar
  "302005", // Bapu Nagar, University
  "302006", // Station Road, Sindhi Camp
  "302012", // Khatipura, Jhotwara Road
  "302013", // Vidhyadhar Nagar
  "302015", // Tonk Phatak, Bajaj Nagar
  "302016", // Malviya Nagar Sector 1-6
  "302017", // Malviya Nagar Industrial Area
  "302018", // Civil Lines, Sodala
  "302019", // Shyam Nagar, Janpath
  "302020", // Mansarovar Sector 1-12
  "302021", // Vaishali Nagar, Chitrakoot
  "302022", // Sitapura Industrial Area
  "302026", // Jagatpura, Model Town
  "302028", // Pratap Nagar Sector 1-14
  "302029", // Sanganer Town
  "302031", // Durgapura
  "302033", // Muhana Road
  "302034", // Gopalpura Bypass, Mahesh Nagar
  "302039", // VKI Industrial Area
]);

export interface ServiceAreaEligibilityResult {
  eligible: boolean;
  code: "AUTHORIZED" | "UNAUTHORIZED" | "INVALID_FORMAT";
  pincode: string;
  reason?: string;
}

/**
 * Validates whether a customer pincode is within the authorized Jaipur pilot service area.
 */
export function validateServiceAreaEligibility(
  rawPincode: string | number | undefined | null
): ServiceAreaEligibilityResult {
  const pincode = String(rawPincode || "").trim();

  // 1. Format check: Must be exactly 6 Indian numeric digits
  if (!/^\d{6}$/.test(pincode)) {
    return {
      eligible: false,
      code: "INVALID_FORMAT",
      pincode,
      reason: "Pincode must be exactly 6 numeric digits",
    };
  }

  // 2. Allowlist verification
  if (JAIPUR_PILOT_PINCODES.includes(pincode)) {
    return {
      eligible: true,
      code: "AUTHORIZED",
      pincode,
      reason: "Within Jaipur urban controlled pilot service area",
    };
  }

  // 3. Out-of-area rejection
  return {
    eligible: false,
    code: "UNAUTHORIZED",
    pincode,
    reason: "Pincode is outside the active Jaipur pilot service area. Gracefully route to waitlist.",
  };
}
