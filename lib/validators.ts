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
  z.union([z.string().min(1), z.array(z.string().min(1))])
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
  mobile: MobileSchema,
  firebase_uid: z.string().min(1, "Firebase UID is required"),
  referral_code: ReferralCodeSchema,
  wizard_answers: WizardAnswersSchema,
  property_type: z.enum(["home", "shop", "office", "factory", "other"]),
  technology_choice: z.enum(["HD", "IP"]),
  cabling_done: z.boolean(),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

export const UpdateLeadStatusSchema = z.object({
  lead_id: z.string().min(1),
  status: z.enum(["new", "contacted", "site_visit", "won", "lost"]),
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
  picture_quality: z.enum(["good", "very_clear", "crystal_clear"]),
  recording_days: z.union([z.literal(7), z.literal(15), z.literal(30)]),
  selected_addons: z.array(z.string()).default([]),
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
  mobile: MobileSchema,
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
  category: z.enum(["camera", "recorder", "accessory"]),
  technology: z.enum(["HD", "IP", "both"]),
  unit_price: MoneySchema,
  is_active: z.boolean().default(true),
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
// ADMIN — PROMOTERS
// ─────────────────────────────────────────────

export const CreatePromoterSchema = z.object({
  name: z.string().min(2).max(100),
  business_name: z.string().min(2).max(200),
  mobile: MobileSchema,
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
