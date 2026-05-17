export type Technology = "HD" | "IP";
export type PlanType = "budget" | "recommended" | "premium";
export type WizardAnswers = Record<string, unknown>;

export interface Address {
  pincode: string;
  landmark1: string;
  landmark2: string;
  full_address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Booking {
  id?: string;
  lead_id: string;
  quote_id: string;
  address: Address;
  scheduled_at?: unknown;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: unknown;
}

export interface Lead {
  id?: string;
  customer_name: string;
  mobile_number: string;
  firebase_uid?: string; // Link to authenticated customer
  property_type: "home" | "office" | "warehouse" | "bungalow";
  technology_choice: "HD" | "IP";
  cabling_done: boolean;
  address?: Address; // Added for Site Details
  wizard_answers: Record<string, unknown>;
  referral_code?: string | null;
  competitor_quote_url?: string;
  status: "new" | "contacted" | "site_visit" | "quoted" | "won" | "lost";
  created_at: unknown;
  updated_at?: unknown;
  site_visit_date?: unknown;
  promoter_id?: string | null;
  promoter_name?: string | null;      // NEW: Virtual field for UI
  promoter_business?: string | null;  // NEW: Virtual field for UI
  assigned_to_salesperson_id?: string | null;
  assigned_to_salesperson_name?: string | null;

  // Franchise Network — auto-set on lead creation from pincode routing
  franchise_dealer_id?: string | null;        // Which franchise dealer owns this lead
  franchise_dealer_name?: string | null;      // Virtual field for UI display

  // Follow-Up Engine
  followups_sent?: string[];
  active_offer?: {
    type: "discount_percent" | "free_amc";
    value?: number;
    campaign_id: string;
  };
}

export interface FollowUpCampaign {
  id?: string;
  name: string;
  trigger_status: "new" | "contacted" | "site_visit" | "quoted";
  delay_hours: number;
  action_channel: "whatsapp" | "email";
  message_template: string;
  offer_type: "discount_percent" | "free_amc" | "none";
  offer_value?: number;
  is_active: boolean;
  created_at: unknown;
  updated_at?: unknown;
}

export interface Product {
  id?: string;
  technical_name: string;
  display_name: string;
  category: "camera" | "recorder" | "accessory" | "cable";
  technology: "HD" | "IP" | "Common" | "WiFi" | "4G";
  base_cost?: number;            // NEW: Cost to business
  margin_percentage?: number;    // NEW: Expected profit margin
  unit_price: number;            // Computed or manual final selling price
  unit_price_budget?: number;    // NEW: Manual Budget price override
  unit_price_premium?: number;   // NEW: Manual Premium price override
  option_price_overrides?: Record<string, number>; // Dynamic pricing adjustments based on options
  is_active: boolean;
  features?: string[];           // NEW: Array of FeatureTag IDs this product supports
  
  // Compatibility System (Phase 3: Hierarchical Category Tree)
  // 1. Where does this product live in the catalog?
  // Example: "CCTV/Cameras/IP/4MP"
  catalog_path?: string;

  // 2. What folders is this product compatible with?
  // Example: ["CCTV/Cameras/IP", "CCTV/Cameras/HD/2MP"]
  compatible_paths?: string[];

  // Channel / port capacity (for recorders, PoE switches, PSUs)
  max_cameras?: number;             // Maximum cameras this product supports
  min_cameras?: number;             // Minimum cameras this product is designed for (optional)

  // Logic Hardening
  resolution_tier?: "good" | "very_clear" | "crystal_clear";
  channels?: number;                // Number of channels (recorder)
  
  // Real Quotation Alignment
  daily_gb_per_camera?: number;     // GB/day at H.265
  paired_dvr_id?: string;           // Legacy: For HD cameras, link to DVR suffix
  bulk_discount_threshold?: number; // Camera count for bulk price
  bulk_unit_price?: number;         // Lower price for bulk
  
  // Brand for premium-tier comparison logic
  brand?: string;

  // Resolution in megapixels — used by wizard to dynamically show available options.
  // Set this on every camera product: 2, 4, 5, 6, or 8.
  // Leave undefined for recorders, accessories, cables.
  resolution_mp?: number;

  image_url?: string;               // NEW: Option to upload an image for the product/kit

  created_at?: unknown;
  updated_at?: unknown;
  updated_by?: string;              // Admin UID who last updated this
}

export interface Addon {
  id?: string;
  display_name: string;
  price: number;
  base_cost?: number;            // NEW: Cost to business
  is_active: boolean;
  
  // NEW: Multiplier logic
  unit_multiplier?: "none" | "camera_count";
  brand?: string;                // NEW: Optional brand labeling
  created_at?: unknown;
  updated_at?: unknown;
}

export interface FeatureTag {
  id?: string;
  technical_name: string;      // e.g., "IK10", "PTZ", "Audio_In"
  customer_label: string;      // e.g., "Hammer-Proof", "Remote Rotation", "Microphone"
  description?: string;        // e.g., "Cannot be easily broken"
  is_active: boolean;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface AddonRule {
  id?: string;
  addon_id: string;
  priority: number;
  action: "show_optional" | "show_mandatory" | "hide";
  conditions: {
    property_type?: string;
    technology?: "HD" | "IP";
    cabling_done?: boolean;
    requirements?: string[];
    
    // NEW: Scaling rules
    min_camera_count?: number;
    max_camera_count?: number;
  };
}

export interface ConfiguratorSelection {
  camera_count: number;
  picture_quality: "good" | "very_clear" | "crystal_clear";
  recording_days: number; // Changed from 7|15|30 to allow custom
  technology: "HD" | "IP";
  selected_addons: string[];
  plan_type: "budget" | "recommended" | "premium";
  selected_camera_option?: number; // 1-5 for IP, 1-2 for HD
  selected_camera_id?: string;     // NEW: Specific camera ID to skip option matching
  
  // NEW FIELDS FROM WIZARD REDESIGN
  surface_types?: string[];
  ceiling_height?: "standard" | "high" | "very_high";
  ladder_arrangement?: "customer" | "team";
  requested_features?: string[];
  brand_preference?: string;
  installation_timeline?: string;
  wants_amc?: boolean;
  focus_point?: "price" | "quality";
  max_budget?: number | null;
  property_type?: "home" | "office" | "warehouse" | "bungalow"; // Added for smart recommendations
}

export interface QuoteLineItem {
  product_id: string;
  display_name: string;
  brand?: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export interface QuoteAddon {
  addon_id: string;
  display_name: string;
  price: number;
  qty?: number; // Added qty for multipliers
}

export interface PricingResult {
  plan_type: "budget" | "recommended" | "premium";
  technology: "HD" | "IP";
  items: QuoteLineItem[];
  addons: QuoteAddon[];
  
  base_hardware_cost: number;
  cabling_cost: number;
  labor_cost: number;
  addons_total: number;
  
  gross_subtotal: number;
  referral_discount: number;
  net_taxable_amount: number;
  
  gst_rate: number;
  gst_amount: number;
  total_payable: number;

  requiresIndustrialQuote?: boolean; // NEW: Flag for > 16 cameras
  
  // Margin Intelligence
  total_purchase_cost?: number;
  gross_profit_value?: number;
  gross_profit_percent?: number;
  margin_warnings?: string[];
}

export type Quote = PricingResult & { id?: string };

export interface AddonRuleResult {
  addon_id: string;
  action: "show_optional" | "show_mandatory" | "hide";
  applied_rule_id: string;
}

export interface AppSettings {
  company_name: string;
  company_logo_url: string | null;
  gst_rate: number;
  labor_fitting_only_rate: number;
  labor_full_installation_rate: number;
  wire_cost_per_meter: number;
  whatsapp_template: string;
  pricing_cache_ttl_seconds: number;
  otp_provider: "firebase_phone" | "other";
  
  // Brand Tier Management
  tier_budget_label: string;
  tier_budget_multiplier: number;
  tier_recommended_label: string;
  tier_recommended_multiplier: number;
  tier_premium_label: string;
  tier_premium_multiplier: number;

  // NEW: High-Fidelity Logic (Real PDF Alignment)
  max_supported_cameras: number;
  labor_ip_per_camera: number;
  labor_hd_per_camera: number;
  cable_copper_coated_ip: number;
  cable_copper_coated_hd: number;
  cable_pure_copper: number;
  cable_overage_per_mtr: number;
  visit_charge: number;
  amc_1yr_pct: number;
  amc_2yr_pct: number;
  amc_3yr_pct: number;
  quote_validity_days: number;
  minimum_margin_threshold?: number; // E.g., 20 for 20% minimum target margin
  high_reach_fee?: number;           // Fee for high ceilings
  labor_cost_margin_percent?: number; // Purchase cost of labor as % of retail (e.g. 70%)

  updated_at?: unknown;
  updated_by?: string | null;
  admin_notification_phone?: string;
}

export interface Promoter {
  id?: string;
  name: string;
  business_name?: string;
  referral_code: string;
  mobile_number?: string;
  email?: string;
  firebase_uid?: string;         // Linked after first OTP login
  is_active: boolean;
  use_global_commission: boolean;
  commission_slabs?: CommissionSlab[];
  total_won_leads: number;
  total_ex_tax_business: number;
  discount_type?: "flat" | "percent";
  discount_value?: number;
  custom_layout_id?: string | null;

  created_at?: unknown;
  updated_at?: unknown;
}

export interface PartnerSession {
  isAuthenticated: boolean;
  promoterId: string | null;
  promoterName: string | null;
  uid: string | null;
  role: "partner" | null;
}

export interface WizardOption {
  id?: string;
  label: string;
  value: string;
  position: number;
  pricing_tags?: string[];
  icon?: string;
  tier_hint?: string;
}

export interface WizardQuestion {
  id?: string;
  question_text: string;
  input_type: "single" | "multi" | "number";
  is_required: boolean;
  position: number;
  options?: WizardOption[];
}

export interface WizardStep {
  id?: string;
  title: string;
  description: string;
  position: number;
  is_active: boolean;
  created_at: unknown;
  questions?: WizardQuestion[];
}

export interface CommissionRecord {
  id?: string;
  lead_id: string;
  quote_id: string;
  promoter_id: string;
  ex_tax_amount: number;
  commission_amount: number;
  status: "pending" | "paid";
  created_at: unknown;
  updated_at: unknown;
  paid_at?: unknown;
}

export interface CommissionSlab {
  from: number;
  to: number | null;
  value: number;
  type: "flat" | "percent";
}

export interface IndustrialLead {
  id?: string;
  phone: string;
  requested_camera_count: number;
  technology?: "HD" | "IP";
  property_type?: string;
  consent: boolean;
  status: "new" | "site_visit_scheduled" | "quoted";
  created_at: unknown;
}

export interface RecommendationRule {
  id?: string;
  priority: number;
  is_active: boolean;
  conditions: {
    property_types?: string[];
    technology?: "HD" | "IP";
    camera_count_min?: number;
    camera_count_max?: number;
    recording_days_min?: number;
    recording_days_max?: number;
  };
  recommendation: {
    camera_option: number;
    label: string;
    reason: string;
    is_featured: boolean;
  };
  created_at?: unknown;
  updated_at?: unknown;
}

export interface RecommendedOutput {
  camera_option: number;
  label: string;
  reason: string;
  is_featured: boolean;
  rule_id: string;
}

// ── Card Layout System (Phase 2) ─────────────────────────────────────────────
// Allows admin to control which 3 cards are shown per customer segment
// without code changes. Stored in Firestore `comparison_card_layouts`.

export interface CardSlot {
  slot: "budget" | "recommended" | "premium";
  technology: "HD" | "IP";
  camera_option: number;
  /** Optional override badge text, e.g. "Smart Upgrade" */
  badge?: string;
  is_featured?: boolean;
}

export interface CardLayoutRule {
  id?: string;
  name: string;                          // e.g. "IP Home Standard"
  description?: string;
  // Conditions — all must match for this layout to be selected
  technology_filter: "HD" | "IP" | "any";
  property_type_filter?: string[];       // e.g. ["home", "bungalow"]
  camera_count_min?: number;
  camera_count_max?: number;
  priority: number;                      // Lower = higher priority
  is_active: boolean;
  // The 3 card slots this layout defines
  cards: [CardSlot, CardSlot, CardSlot];
  created_at?: unknown;
  updated_at?: unknown;
}

// ── Geographic Zones (for Salesperson coverage) ───────────────────────────────
// Admin creates named zones (e.g. "Jaipur North"), each with a list of pincodes.
// Salespeople are assigned zones \u2192 they see only leads from those pincodes.

export interface CoverageZone {
  id?: string;
  name: string;                          // e.g. "Jaipur North", "Ajmer East"
  city: string;
  state: string;
  pincodes: string[];                    // All pincodes in this zone
  is_active: boolean;
  created_at?: unknown;
  updated_at?: unknown;
}

// ── Salesperson (Internal Sales Team) ────────────────────────────────────────
// New role between Admin and Customer. Logs in via OTP (same as partners).
// Can only see/edit leads within their assigned geographic coverage.
// Admin creates accounts \u2014 cannot self-register.

export interface Salesperson {
  id?: string;
  name: string;
  mobile_number: string;
  firebase_uid?: string;                 // Set after first OTP login
  is_active: boolean;
  // Geographic coverage — at least one must be set
  assigned_zone_ids?: string[];          // Zone IDs from coverage_zones collection
  assigned_pincodes?: string[];          // Direct pincode overrides
  assigned_cities?: string[];
  assigned_states?: string[];
  created_at?: unknown;
  updated_at?: unknown;
}

// ── Franchise Network ─────────────────────────────────────────────────────────
// A FranchiseDealer is an external CCTV installation business operating under
// the TEAM CCTV brand. They own exclusive territory (pincodes), execute
// installations, and earn commission per sale. Admin controls their pricing.

export interface FranchiseDealer {
  id?: string;
  company_name: string;                  // e.g., "Sharma CCTV Dealers"
  owner_name: string;                    // Contact person
  mobile_number: string;                 // OTP login
  email?: string;
  firebase_uid?: string;                 // Set after first OTP login
  is_active: boolean;

  // Territory (pincode-based — exclusive rights)
  assigned_zone_ids?: string[];          // Links to CoverageZone documents
  assigned_pincodes?: string[];          // Direct pincode list
  assigned_cities?: string[];            // City-level fallback
  assigned_states?: string[];            // State-level fallback (broadest)
  territory_exclusivity: boolean;        // true = no other dealer can serve these pincodes

  // Franchise Agreement
  franchise_fee_monthly: number;         // Monthly fixed fee in INR
  commission_percent: number;            // % of ex-tax sale value (e.g., 6)
  agreement_start_date?: unknown;
  agreement_end_date?: unknown;

  // Performance Counters (updated on lead events)
  total_leads_received: number;
  total_leads_won: number;
  total_ex_tax_business: number;         // Cumulative ex-GST sales value
  total_commission_due: number;          // Commission earned, not yet paid
  total_commission_paid: number;         // Commission already disbursed

  created_at?: unknown;
  updated_at?: unknown;
}

// Per-franchise pricing overrides — admin sets different purchase costs
// and margins per franchise to reflect local supplier pricing and competition.
export interface FranchisePricingOverride {
  id?: string;
  franchise_dealer_id: string;           // FK → FranchiseDealer.id

  // Product-level overrides (purchase cost may differ by city/supplier)
  product_overrides: {
    product_id: string;
    purchase_cost: number;               // Local supplier cost
    margin_percent?: number;             // Custom margin for this franchise
    unit_price_override?: number;        // Final price lock (skips margin calc)
  }[];

  // Labor and cabling overrides (differ by city)
  labor_ip_per_camera?: number;
  labor_hd_per_camera?: number;
  cable_cost_per_meter?: number;

  // Admin-enforced pricing guardrails
  minimum_margin_percent: number;        // Floor — franchise cannot go below this
  maximum_discount_percent: number;      // Max discount franchise can offer customer

  created_at?: unknown;
  updated_at?: unknown;
}
