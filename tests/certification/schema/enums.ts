import { z } from "zod";

export const TECHNOLOGIES = [
  "HD",
  "IP",
  "Wireless",
] as const;

export type Technology = (typeof TECHNOLOGIES)[number];

export const TECHNOLOGY_ALIASES = [
  "HD",
  "Analog",
  "Analog HD",
  "AHD",
  "TVI",
  "CVI",
  "Analogue",
  "DVR",
  "IP",
  "Network",
  "Network IP",
  "NVR",
  "Wireless",
  "WiFi",
  "Wi-Fi",
  "4G",
  "4G LTE",
  "4G/LTE",
] as const;

export type TechnologyAlias = (typeof TECHNOLOGY_ALIASES)[number];

export const WIRELESS_FAMILIES = [
  "indoor_ptz",
  "indoor_fixed",
  "outdoor_bullet",
  "outdoor_ptz",
  "4g_solar",
] as const;

export type WirelessFamily = (typeof WIRELESS_FAMILIES)[number];

export const RECORDING_MODES = [
  "continuous",
  "motion",
  "smart",
] as const;

export type RecordingMode = (typeof RECORDING_MODES)[number];

export const INSTALLATION_TYPES = [
  "new",
  "addon",
  "replacement",
] as const;

export type InstallationType = (typeof INSTALLATION_TYPES)[number];

export const CABLING_MODES = [
  "all_new",
  "all_existing",
  "mixed",
] as const;

export type CablingMode = (typeof CABLING_MODES)[number];

/** Exact repository enum (`lib/validators.ts` / `types/index.ts`). */
export const WIRING_TYPES = [
  "open",
  "conduit",
] as const;

export type WiringType = (typeof WIRING_TYPES)[number];

/** Exact repository enum (`lib/validators.ts` / `types/index.ts`). */
export const POWER_WIRING_OPTIONS = [
  "socket_available",
  "wire_needed",
  "site_survey",
] as const;

export type PowerWiringOption = (typeof POWER_WIRING_OPTIONS)[number];

/** Exact repository enum (`types/index.ts` / `lib/pricing-engine.ts`). */
export const INSTALLATION_PREFERENCES = [
  "pro",
  "diy",
] as const;

export type InstallationPreference = (typeof INSTALLATION_PREFERENCES)[number];

export const HYBRID_WIRED_TECHNOLOGIES = [
  "HD",
  "IP",
] as const;

export type HybridWiredTechnology = (typeof HYBRID_WIRED_TECHNOLOGIES)[number];

export const CEILING_HEIGHTS = [
  "standard",
  "high",
  "very_high",
] as const;

export type CeilingHeight = (typeof CEILING_HEIGHTS)[number];

export const ACTIVE_OFFER_TYPES = [
  "discount_percent",
  "free_amc",
] as const;

export type ActiveOfferType = (typeof ACTIVE_OFFER_TYPES)[number];

export const CLASSIFICATIONS = [
  "VALID",
  "INVALID",
  "MANUAL_QUOTE",
] as const;

export type RequirementClassification = (typeof CLASSIFICATIONS)[number];

export const LEGACY_PLAN_FIELDS = [
  "plan_type",
  "tier",
  "selected_plan",
  "plan",
] as const;

export const TECHNOLOGY_SCHEMA = z.enum(TECHNOLOGIES);
export const TECHNOLOGY_ALIAS_SCHEMA = z.enum(TECHNOLOGY_ALIASES);
export const WIRELESS_FAMILY_SCHEMA = z.enum(WIRELESS_FAMILIES);
export const RECORDING_MODE_SCHEMA = z.enum(RECORDING_MODES);
export const INSTALLATION_TYPE_SCHEMA = z.enum(INSTALLATION_TYPES);
export const CABLING_MODE_SCHEMA = z.enum(CABLING_MODES);
export const WIRING_TYPE_SCHEMA = z.enum(WIRING_TYPES);
export const POWER_WIRING_OPTION_SCHEMA = z.enum(POWER_WIRING_OPTIONS);
export const INSTALLATION_PREFERENCE_SCHEMA = z.enum(INSTALLATION_PREFERENCES);
export const HYBRID_WIRED_TECHNOLOGY_SCHEMA = z.enum(HYBRID_WIRED_TECHNOLOGIES);
export const CEILING_HEIGHT_SCHEMA = z.enum(CEILING_HEIGHTS);
export const ACTIVE_OFFER_TYPE_SCHEMA = z.enum(ACTIVE_OFFER_TYPES);
