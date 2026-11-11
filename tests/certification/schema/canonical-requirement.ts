import { z } from "zod";
import {
  ACTIVE_OFFER_TYPES,
  CABLING_MODES,
  CEILING_HEIGHT_SCHEMA,
  HYBRID_WIRED_TECHNOLOGIES,
  INSTALLATION_PREFERENCES,
  INSTALLATION_TYPES,
  POWER_WIRING_OPTIONS,
  RECORDING_MODES,
  TECHNOLOGY_SCHEMA,
  WIRELESS_FAMILIES,
  WIRING_TYPES,
} from "./enums.ts";

export const CeilingHeightSchema = CEILING_HEIGHT_SCHEMA;

export const LocationSchema = z
  .object({
    city: z.string().trim().min(1).optional(),
    state: z.string().trim().min(1).optional(),
    pincode: z.string().regex(/^\d{6}$/, "Pincode must contain 6 digits").optional(),
  })
  .strict();

export const CameraRequirementSchema = z
  .object({
    technology: TECHNOLOGY_SCHEMA,
    count: z.number().int().min(0),
    brand: z.string().trim().min(1).optional(),
    model: z.string().trim().min(1).optional(),
    resolution: z.string().trim().min(1).optional(),
    wireless_family: z.enum(WIRELESS_FAMILIES).optional(),
    requested_features: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export const ExistingSystemSchema = z
  .object({
    existing_system_known: z.boolean().optional(),
    existing_technology: TECHNOLOGY_SCHEMA.optional(),
    existing_recorder_channels: z.number().int().nonnegative().optional(),
    existing_working_cameras: z.number().int().nonnegative().optional(),
    retain_existing_storage: z.boolean().optional(),
  })
  .strict();

export const ActiveOfferSchema = z
  .object({
    type: z.enum(ACTIVE_OFFER_TYPES),
    value: z.number().finite().nonnegative().optional(),
    campaign_id: z.string().trim().min(1),
  })
  .strict();

export const RecorderRequirementSchema = z
  .object({
    brand: z.string().trim().min(1).optional(),
    technology: z.string().trim().min(1).optional(),
    channel_capacity: z.number().int().positive().optional(),
  })
  .strict();

export const StorageRequirementSchema = z
  .object({
    brand: z.string().trim().min(1).optional(),
    selected: z.boolean().optional(),
  })
  .strict();

export const WirelessPowerSchema = z
  .object({
    power_wiring_option: z.enum(POWER_WIRING_OPTIONS).optional(),
    total_power_cable_meters: z.number().finite().nonnegative().optional(),
  })
  .strict();

/**
 * Single source of truth for canonical quotation certification inputs.
 * Intentionally aligned with repository enums (`open`/`conduit`,
 * `socket_available`/`wire_needed`/`site_survey`, `pro`/`diy`, `smart`, `0..365` days).
 */
export const CanonicalRequirementSchema = z
  .object({
    camera_count: z.number().int().min(0).max(128),
    cameras: z.array(CameraRequirementSchema),
    technology: TECHNOLOGY_SCHEMA.optional(),

    recording_mode: z.enum(RECORDING_MODES).optional(),
    recording_days: z.number().int().min(0).max(365).optional(),

    installation_type: z.enum(INSTALLATION_TYPES).optional(),
    installation_preference: z.enum(INSTALLATION_PREFERENCES).optional(),

    wiring_type: z.enum(WIRING_TYPES).optional(),
    cabling_mode: z.enum(CABLING_MODES).optional(),
    cable_type: z.string().trim().min(1).optional(),
    cabling_needed_cameras: z.number().int().nonnegative().optional(),
    cable_length_meters: z.number().finite().nonnegative().optional(),

    power_wiring_option: z.enum(POWER_WIRING_OPTIONS).optional(),
    total_power_cable_meters: z.number().finite().nonnegative().optional(),

    property_type: z.string().trim().min(1).optional(),
    surface_types: z.array(z.string().trim().min(1)).optional(),
    ceiling_height: CeilingHeightSchema.optional(),

    wants_remote_viewing: z.boolean().optional(),
    wants_amc: z.boolean().optional(),
    broadband_status: z.string().trim().min(1).optional(),

    is_hybrid: z.boolean().optional(),
    hybrid_wired_technology: z.enum(HYBRID_WIRED_TECHNOLOGIES).optional(),

    requested_features: z.array(z.string().trim().min(1)).optional(),
    sensor_preference: z.string().trim().min(1).optional(),

    target_storage_tb: z.number().finite().nonnegative().optional(),
    preferred_storage_brand: z.string().trim().min(1).optional(),
    is_economy_storage: z.boolean().optional(),

    max_budget: z.number().finite().nonnegative().optional(),
    referral_code: z.string().trim().min(1).optional(),
    source: z.string().trim().min(1).optional(),

    recorder_technology: z.string().trim().min(1).optional(),
    recorder_channels: z.number().int().positive().optional(),
    recorder_brand: z.string().trim().min(1).optional(),
    recorder: RecorderRequirementSchema.optional(),

    power_supply_technology: z.string().trim().min(1).optional(),

    storage_selected: z.boolean().optional(),
    storage_brand: z.string().trim().min(1).optional(),
    storage: StorageRequirementSchema.optional(),

    wireless_power: WirelessPowerSchema.optional(),
    existing_system: ExistingSystemSchema.optional(),
    active_offer: ActiveOfferSchema.optional(),

    location: LocationSchema.optional(),
    city: z.string().trim().min(1).optional(),
    state: z.string().trim().min(1).optional(),
    pincode: z.string().regex(/^\d{6}$/, "Pincode must contain 6 digits").optional(),

    legacy_plan_type: z.string().trim().min(1).optional(),
    legacy_tier: z.string().trim().min(1).optional(),
    legacy_selected_plan: z.string().trim().min(1).optional(),
    legacy_plan: z.string().trim().min(1).optional(),

    plan_type: z.string().trim().min(1).optional(),
    tier: z.string().trim().min(1).optional(),
    selected_plan: z.string().trim().min(1).optional(),
    plan: z.string().trim().min(1).optional(),
  })
  .strict();

export type CameraRequirement = z.infer<typeof CameraRequirementSchema>;
export type ExistingSystem = z.infer<typeof ExistingSystemSchema>;
export type ExistingSystemRequirement = ExistingSystem;
export type ActiveOffer = z.infer<typeof ActiveOfferSchema>;
export type RecorderRequirement = z.infer<typeof RecorderRequirementSchema>;
export type StorageRequirement = z.infer<typeof StorageRequirementSchema>;
export type WirelessPower = z.infer<typeof WirelessPowerSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type CanonicalRequirement = z.infer<typeof CanonicalRequirementSchema>;

export function parseCanonicalRequirement(value: unknown): CanonicalRequirement {
  return CanonicalRequirementSchema.parse(value);
}
