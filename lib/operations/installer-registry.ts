/**
 * @file lib/operations/installer-registry.ts
 * @description Phase 8 Jaipur Installer Supply Network & Versioned Rate Card.
 * Manages 3 primary + 3 backup certified installation partners across Jaipur zones,
 * enforcing rate card versioning and coverage verification.
 */

export interface InstallerProfile {
  id: string;
  name: string;
  phone: string;
  tier: "PRIMARY" | "BACKUP";
  assignedZone: "ZONE_SOUTH" | "ZONE_EAST" | "ZONE_WEST_NORTH";
  coveragePincodes: string[];
  rateCardVersion: string;
  isActive: boolean;
  kycVerified: boolean;
  totalCompletedJobs: number;
  averageRating: number; // 1.0 to 5.0
  legalStatus?: "ACTIVE" | "PENDING_ACCEPTANCE" | "SUSPENDED";
  acceptedAgreements?: Array<{
    agreementId: string;
    version: string;
    acceptedAt: string;
    snapshotId: string;
  }>;
}

export const INSTALL_RATE_CARD_V1 = Object.freeze({
  version: "INSTALL-RATE-V1",
  effectiveDate: "2026-11-15",
  rates: {
    hdCameraFitting: 300,
    ipPoECameraFitting: 450,
    wirelessCameraSetup: 350,
    extraCablingPerMeter: 18,
    conduitCasingPerMeter: 25,
    emergencySiteVisit: 300,
    nvrRackMounting: 400,
  },
});

/**
 * Jaipur Certified 6-Installer Pilot Network (3 Primary + 3 Backup)
 */
export const JAIPUR_PILOT_INSTALLERS: readonly InstallerProfile[] = Object.freeze([
  // Zone 1: South (Mansarovar, Sanganer, Gopalpura)
  {
    id: "tech_jp_south_pri",
    name: "Mukesh Sharma (Primary)",
    phone: "919829101001",
    tier: "PRIMARY",
    assignedZone: "ZONE_SOUTH",
    coveragePincodes: ["302020", "302029", "302018", "302015"],
    rateCardVersion: INSTALL_RATE_CARD_V1.version,
    isActive: true,
    kycVerified: true,
    totalCompletedJobs: 48,
    averageRating: 4.9,
  },
  {
    id: "tech_jp_south_bak",
    name: "Ramesh Verma (Backup)",
    phone: "919829101002",
    tier: "BACKUP",
    assignedZone: "ZONE_SOUTH",
    coveragePincodes: ["302020", "302029", "302018"],
    rateCardVersion: INSTALL_RATE_CARD_V1.version,
    isActive: true,
    kycVerified: true,
    totalCompletedJobs: 26,
    averageRating: 4.8,
  },

  // Zone 2: East (Malviya Nagar, Jagatpura, Pratap Nagar)
  {
    id: "tech_jp_east_pri",
    name: "Sunil Choudhary (Primary)",
    phone: "919829101003",
    tier: "PRIMARY",
    assignedZone: "ZONE_EAST",
    coveragePincodes: ["302017", "302025", "302033", "302004"],
    rateCardVersion: INSTALL_RATE_CARD_V1.version,
    isActive: true,
    kycVerified: true,
    totalCompletedJobs: 52,
    averageRating: 4.95,
  },
  {
    id: "tech_jp_east_bak",
    name: "Deepak Saini (Backup)",
    phone: "919829101004",
    tier: "BACKUP",
    assignedZone: "ZONE_EAST",
    coveragePincodes: ["302017", "302025", "302033"],
    rateCardVersion: INSTALL_RATE_CARD_V1.version,
    isActive: true,
    kycVerified: true,
    totalCompletedJobs: 19,
    averageRating: 4.75,
  },

  // Zone 3: West/North (Vaishali Nagar, Jhotwara, VKI)
  {
    id: "tech_jp_west_pri",
    name: "Vikas Meena (Primary)",
    phone: "919829101005",
    tier: "PRIMARY",
    assignedZone: "ZONE_WEST_NORTH",
    coveragePincodes: ["302012", "302021", "302013", "302039", "302001"],
    rateCardVersion: INSTALL_RATE_CARD_V1.version,
    isActive: true,
    kycVerified: true,
    totalCompletedJobs: 64,
    averageRating: 4.9,
  },
  {
    id: "tech_jp_west_bak",
    name: "Anil Kumar (Backup)",
    phone: "919829101006",
    tier: "BACKUP",
    assignedZone: "ZONE_WEST_NORTH",
    coveragePincodes: ["302012", "302021", "302013", "302039"],
    rateCardVersion: INSTALL_RATE_CARD_V1.version,
    isActive: true,
    kycVerified: true,
    totalCompletedJobs: 31,
    averageRating: 4.8,
  },
]);

/**
 * Resolves available primary and backup installers for a customer pincode.
 */
export function resolveInstallerForPincode(pincode: string | number): {
  primary: InstallerProfile | null;
  backup: InstallerProfile | null;
  zone: string | null;
} {
  const pin = String(pincode).trim();
  const matched = JAIPUR_PILOT_INSTALLERS.filter((inst) => inst.isActive && inst.coveragePincodes.includes(pin));

  const primary = matched.find((inst) => inst.tier === "PRIMARY") || null;
  const backup = matched.find((inst) => inst.tier === "BACKUP") || null;

  return {
    primary,
    backup,
    zone: primary?.assignedZone || backup?.assignedZone || null,
  };
}
