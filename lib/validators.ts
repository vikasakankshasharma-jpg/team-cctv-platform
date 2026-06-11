/**
 * @file lib/validators.ts
 * @description All Zod validation schemas for TEAM CCTV Platform.
 * These schemas validate:
 *  - All API route inputs (POST bodies, query params)
 *  - All Firestore write payloads before they are committed
 * Import the schema you need in both API routes (server) and
 * client-side form validation hooks.
 */

import { z } from "zod";

// ─────────────────────────────────────────────
// SHARED / PRIMITIVE SCHEMAS
// ─────────────────────────────────────────────

/** Indian mobile number — 10 digits, starts with 6-9 */
export const MobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

/** Alphanumeric referral code */
export const ReferralCodeSchema = z
  .string()
  .regex(/^[A-Z0-9]{4,12}$/, "Referral code must be 4–12 uppercase alphanumeric characters")
  .optional();

/** Monetary amount — must be finite number with max 2 decimal places */
export const MoneySchema = z
  .number()
  .finite()
  .nonnegative()
  .multipleOf(0.01, "Monetary values must have at most 2 decimal places");

/** Commission slab — validates a single entry */
export const CommissionSlabSchema = z.object({
  from: z.number().nonnegative(),
  to: z.number().positive().nullable(),
  type: z.enum(["flat", "percent"]),
  value: z.number().positive(),
});

// ─────────────────────────────────────────────
// WIZARD
// ─────────────────────────────────────────────

/** Answers submitted from the wizard — keyed by questionId */
export const WizardAnswersSchema = z.record(
  z.string().min(1),
  z.any()
);

/** POST /api/wizard — not needed (GET only), but kept for completeness */
export const WizardConfigQuerySchema = z.object({
  include_inactive: z.coerce.boolean().optional().default(false),
});

// ─────────────────────────────────────────────
// LEAD CAPTURE GATE
// ─────────────────────────────────────────────

export const CreateLeadSchema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  mobile_number: MobileSchema,
  firebase_uid: z.string().min(1, "Firebase UID is required"),
  referral_code: ReferralCodeSchema,
  wizard_answers: WizardAnswersSchema,
  property_type: z.enum(["home", "shop", "office", "factory", "other"]),
  technology_choice: z.enum(["HD", "IP", "WiFi", "4G", "Analog", "Wireless"]),
  cabling_done: z.boolean(),
  camera_count: z.number().int().nonnegative().optional(),
  status: z.enum(["partial", "new", "contacted", "site_visit", "won", "lost"]).optional(),
  email: z.string().email().optional(),
  detected_city: z.string().optional(),
  source: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

export const UpdateLeadStatusSchema = z.object({
  lead_id: z.string().min(1),
  status: z.enum(["partial", "new", "contacted", "site_visit", "won", "lost"]),
  note: z.string().max(500).optional(),
});

export type UpdateLeadStatusInput = z.infer<typeof UpdateLeadStatusSchema>;

// ─────────────────────────────────────────────
// QUOTE GENERATION
// ─────────────────────────────────────────────

export const GenerateQuoteSchema = z.object({
  lead_id: z.string().min(1),
  plan_type: z.enum(["budget", "recommended", "premium"]),
  technology: z.enum(["HD", "IP"]),
  camera_count: z.number().int().min(1).max(16),
  mixed_camera_requirements: z.array(z.object({
    type: z.string(),
    count: z.number().int().min(1),
    resolution: z.string().optional(),
    technology: z.string().optional()
  })).optional(),
  picture_quality: z.enum(["good", "very_clear", "crystal_clear"]),
  recording_days: z.number().int().min(1).max(365),
  selected_addons: z.array(z.string()).default([]),
  selected_camera_option: z.number().int().optional(),
  selected_camera_id: z.string().optional(),
  selected_recorder_id: z.string().optional(),
  selected_storage_id: z.string().optional(),
  selected_power_id: z.string().optional(),
  expected_total_payable: z.number().nonnegative().optional(),
  brand_preference: z.string().nullable().optional(),
  resolution_preference: z.string().nullable().optional(),
  property_type: z.string().nullable().optional(),
  requested_features: z.array(z.string()).nullable().optional(),
  max_budget: z.number().nullable().optional(),
  cable_length_meters: z.number().nullable().optional(),
  wiring_type: z.enum(["open", "conduit"]).nullable().optional(),
});

export type GenerateQuoteInput = z.infer<typeof GenerateQuoteSchema>;

export const SaveQuoteSchema = GenerateQuoteSchema.extend({
  quote_id: z.string().optional(), // if updating an existing draft
});

// ─────────────────────────────────────────────
// SITE VISIT BOOKING
// ─────────────────────────────────────────────

export const CreateSiteVisitSchema = z.object({
  lead_id: z.string().min(1),
  customer_name: z.string().min(2).max(100),
  mobile_number: MobileSchema,
  address: z.string().min(5, "Please enter a full address").max(300),
  preferred_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  preferred_time: z.string().min(1),
});

export type CreateSiteVisitInput = z.infer<typeof CreateSiteVisitSchema>;

// ─────────────────────────────────────────────
// ADMIN — PRODUCTS
// ─────────────────────────────────────────────

export const CreateProductSchema = z.object({
  technical_name: z.string().min(2).max(100),
  display_name: z.string().min(2).max(100),
  category: z.enum(["camera", "recorder", "accessory", "cable"]),
  technology: z.enum(["HD", "IP", "both"]),
  unit_price: MoneySchema,
  unit_price_budget: z.number().min(0).optional(),
  unit_price_premium: z.number().min(0).optional(),
  base_cost: z.number().min(0).optional(),
  margin_percentage: z.number().min(0).optional(),
  min_cameras: z.number().int().min(1).optional(),
  max_cameras: z.number().int().min(1).optional(),
  channels: z.number().int().min(1).optional(),
  resolution_tier: z.enum(["good", "very_clear", "crystal_clear"]).optional(),
  brand: z.string().optional(),
  catalog_path: z.string().optional(),
  compatible_paths: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  updated_by: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().min(1),
});

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// ─────────────────────────────────────────────
// ADMIN — ADD-ONS
// ─────────────────────────────────────────────

export const CreateAddonSchema = z.object({
  technical_name: z.string().min(2).max(100),
  display_name: z.string().min(2).max(100),
  price: MoneySchema,
  is_active: z.boolean().default(true),
});

export type CreateAddonInput = z.infer<typeof CreateAddonSchema>;

export const UpdateAddonSchema = CreateAddonSchema.partial().extend({
  id: z.string().min(1),
});

export const CreateAddonRuleSchema = z.object({
  priority: z.number().int().positive(),
  conditions: z.object({
    property_type: z.enum(["home", "shop", "office", "factory", "other"]).optional(),
    technology: z.enum(["HD", "IP"]).optional(),
    requirements: z.array(z.string()).optional(),
    cabling_done: z.boolean().optional(),
  }),
  action: z.enum(["show_optional", "show_mandatory", "hide"]),
  addon_id: z.string().min(1),
});

export type CreateAddonRuleInput = z.infer<typeof CreateAddonRuleSchema>;

// ─────────────────────────────────────────────
// ADMIN — WIZARD BUILDER
// ─────────────────────────────────────────────

export const CreateWizardStepSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(300).optional().default(""),
  position: z.number().int().nonnegative(),
  is_active: z.boolean().default(true),
});

export type CreateWizardStepInput = z.infer<typeof CreateWizardStepSchema>;

export const CreateWizardQuestionSchema = z.object({
  step_id: z.string().min(1),
  question_text: z.string().min(5).max(300),
  position: z.number().int().nonnegative(),
  input_type: z.enum(["single", "multi"]),
  is_required: z.boolean().default(true),
});

export type CreateWizardQuestionInput = z.infer<typeof CreateWizardQuestionSchema>;

export const CreateWizardOptionSchema = z.object({
  step_id: z.string().min(1),
  question_id: z.string().min(1),
  label: z.string().min(1).max(200),
  value: z.string().min(1).max(50),
  position: z.number().int().nonnegative(),
  pricing_tags: z.array(z.string()).default([]),
});

export type CreateWizardOptionInput = z.infer<typeof CreateWizardOptionSchema>;

/** Reorder payload — array of { id, position } pairs */
export const ReorderStepsSchema = z.array(
  z.object({
    id: z.string().min(1),
    position: z.number().int().nonnegative(),
  })
);

// ─────────────────────────────────────────────
// ADMIN — HUBS & INSTALLERS
// ─────────────────────────────────────────────

export const CreateHubSchema = z.object({
  name: z.string().min(2, "Hub name is required").max(100),
  manager_name: z.string().min(2, "Manager name is required").max(100),
  city_name: z.string().min(2, "City name is required").max(100),
  mobile_number: MobileSchema,
  email: z.string().email("Please provide a valid email address").optional().nullable(),
  pincode_coverage: z.array(z.string()).min(1, "At least one pincode is required"),
  latitude: z.number().min(-90).max(90, "Invalid latitude"),
  longitude: z.number().min(-180).max(180, "Invalid longitude"),
  stock_capacity: z.number().int().nonnegative().optional().default(0),
});

export type CreateHubInput = z.infer<typeof CreateHubSchema>;

export const CreateInstallerSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  mobile_number: MobileSchema,
  email: z.string().email().optional().nullable(),
  serviceable_pincodes: z.array(z.string()).min(1, "At least one pincode is required"),
  skills: z.array(z.string()).default([]),
});

export type CreateInstallerInput = z.infer<typeof CreateInstallerSchema>;

export const UpdateInstallerSchema = CreateInstallerSchema.partial().extend({
  id: z.string().min(1),
  kyc_status: z.enum(["pending", "verified", "suspended"]).optional(),
  is_active: z.boolean().optional(),
});
export type UpdateInstallerInput = z.infer<typeof UpdateInstallerSchema>;

export const ApplyInstallerSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  mobile_number: MobileSchema,
  company_name: z.string().max(100).optional().nullable(),
  primary_pincode: z.string().length(6, "Pincode must be exactly 6 digits"),
  years_experience: z.coerce.number().min(0, "Experience must be valid"),
  gstin: z.string().max(20).optional().nullable(),
});
export type ApplyInstallerInput = z.infer<typeof ApplyInstallerSchema>;

// ─────────────────────────────────────────────
// ADMIN — PROMOTERS
// ─────────────────────────────────────────────

export const CreatePromoterSchema = z.object({
  name: z.string().min(2).max(100),
  business_name: z.string().min(2).max(200),
  mobile_number: MobileSchema,
  email: z.string().email("Enter a valid email address"),
  discount_type: z.enum(["flat", "percent"]),
  discount_value: z.number().positive(),
  commission_slabs: z.array(CommissionSlabSchema).default([]),
  use_global_commission: z.boolean().default(true),
});

export type CreatePromoterInput = z.infer<typeof CreatePromoterSchema>;

export const UpdatePromoterSchema = CreatePromoterSchema.partial().extend({
  id: z.string().min(1),
  is_active: z.boolean().optional(),
});

export type UpdatePromoterInput = z.infer<typeof UpdatePromoterSchema>;

// ─────────────────────────────────────────────
// ADMIN — GEO-PRICING RULES
// ─────────────────────────────────────────────

export const CreateGeoPricingRuleSchema = z.object({
  level: z.enum(["pincode", "city", "state", "surge"]),
  target_value: z.string().min(2, "Target value is required").max(100),
  priority: z.number().int().positive(),
  labor_multiplier: z.number().positive().optional(),
  margin_override: z.number().min(0).max(100).optional(),
  flat_travel_fee: MoneySchema.optional(),
  is_active: z.boolean().default(true),
  valid_until: z.string().optional().nullable(),
});

export type CreateGeoPricingRuleInput = z.infer<typeof CreateGeoPricingRuleSchema>;

/**
 * Validate commission slabs: no gaps, no overlaps.
 * Returns an error string or null if valid.
 */
export function validateCommissionSlabs(slabs: z.infer<typeof CommissionSlabSchema>[]): string | null {
  if (slabs.length === 0) return null;

  // Sort by 'from' ascending
  const sorted = [...slabs].sort((a, b) => a.from - b.from);

  for (let i = 0; i < sorted.length; i++) {
    const slab = sorted[i];

    // Last slab must have to = null
    if (i === sorted.length - 1 && slab.to !== null) {
      return `Last slab must have no upper limit (set "to" to null)`;
    }

    // Non-last slabs must have a finite to
    if (i < sorted.length - 1 && slab.to === null) {
      return `Only the last slab can have no upper limit`;
    }

    // Check for gap between this slab's end and next slab's start
    if (i < sorted.length - 1) {
      const next = sorted[i + 1];
      if (slab.to !== next.from) {
        return `Gap or overlap detected between slabs: ${slab.to} → ${next.from}`;
      }
    }
  }

  // First slab must start at 0
  if (sorted[0].from !== 0) {
    return `First slab must start from 0`;
  }

  return null;
}

// ─────────────────────────────────────────────
// ADMIN — COMMISSION RULES
// ─────────────────────────────────────────────

export const CreateCommissionRuleSchema = z.object({
  scope: z.enum(["global", "promoter"]),
  promoter_id: z.string().nullable().default(null),
  slabs: z.array(CommissionSlabSchema).min(1, "At least one slab is required"),
});

export type CreateCommissionRuleInput = z.infer<typeof CreateCommissionRuleSchema>;

export const CreatePayoutSchema = z.object({
  promoter_id: z.string().min(1),
  record_ids: z.array(z.string().min(1)).min(1, "Select at least one commission record"),
  payment_reference: z.string().min(1, "Payment reference is required"),
});

export type CreatePayoutInput = z.infer<typeof CreatePayoutSchema>;

// ─────────────────────────────────────────────
// ADMIN — SETTINGS
// ─────────────────────────────────────────────

export const UpdateSettingsSchema = z.object({
  company_name: z.string().min(2).max(100).optional(),
  company_logo_url: z.string().url().nullable().optional(),
  gst_rate: z.number().min(0).max(100).optional(),
  whatsapp_template: z.string().max(1000).optional(),
  pricing_cache_ttl_seconds: z.number().int().positive().optional(),
  labor_fitting_only_rate: MoneySchema.optional(),
  labor_full_installation_rate: MoneySchema.optional(),
  wire_cost_per_meter: MoneySchema.optional(),
  conduit_cost_per_meter: MoneySchema.optional(),
});

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;

// ─────────────────────────────────────────────
// ADMIN — REPORTS
// ─────────────────────────────────────────────

export const ReportQuerySchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  promoter_id: z.string().optional(),
});

export type ReportQueryInput = z.infer<typeof ReportQuerySchema>;

// ─────────────────────────────────────────────
// PRICE MATCH
// ─────────────────────────────────────────────

export const PriceMatchSubmitSchema = z.object({
  lead_id: z.string().min(1),
  competitor_quote_url: z.string().url(),
  competitor_name: z.string().optional(),
  competitor_total: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
  uploaded_by_name: z.string().min(1),
});

export type PriceMatchSubmitInput = z.infer<typeof PriceMatchSubmitSchema>;

export const PriceMatchReviewSchema = z.object({
  status: z.enum(["approved", "rejected", "counter_offered"]),
  review_notes: z.string().max(500).optional(),
  approved_discount_percent: z.number().min(0).max(50).optional(),
  approved_discount_flat: z.number().min(0).optional(),
  counter_offer_amount: z.number().positive().optional(),
});

export type PriceMatchReviewInput = z.infer<typeof PriceMatchReviewSchema>;

// ─────────────────────────────────────────────
// API AUTH HELPERS
// ─────────────────────────────────────────────

/** Expected shape of a decoded Firebase ID token custom claim */
export const AdminTokenClaimsSchema = z.object({
  uid: z.string(),
  role: z.enum(["super_admin", "sales_staff"]),
  email: z.string().email().optional(),
});

export type AdminTokenClaims = z.infer<typeof AdminTokenClaimsSchema>;

/** Standard API error response shape */
export const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
});
