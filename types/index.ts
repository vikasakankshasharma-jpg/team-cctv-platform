export type Technology = "HD" | "IP";
export type PlanType = "budget" | "recommended" | "premium";
export type WizardAnswers = Record<string, any>;

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
  scheduled_at?: any;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: any;
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
  wizard_answers: Record<string, any>;
  referral_code?: string | null;
  status: "new" | "contacted" | "site_visit" | "quoted" | "won" | "lost";
  created_at: any;
}

export interface Product {
  id?: string;
  technical_name: string;
  display_name: string;
  category: "camera" | "recorder" | "accessory" | "cable";
  technology: "HD" | "IP" | "both";
  unit_price: number;
  is_active: boolean;
  
  // NEW: Logic Hardening Fields
  resolution_tier?: "good" | "very_clear" | "crystal_clear";
  channels?: number; // Only for Recorders
}

export interface Addon {
  id?: string;
  display_name: string;
  price: number;
  is_active: boolean;
  
  // NEW: Multiplier logic
  unit_multiplier?: "none" | "camera_count";
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
  recording_days: 7 | 15 | 30;
  technology: "HD" | "IP";
  selected_addons: string[];
  plan_type: "budget" | "recommended" | "premium";
}

export interface QuoteLineItem {
  product_id: string;
  display_name: string;
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

  updated_at?: any;
  updated_by?: string | null;
}

export interface Promoter {
  id?: string;
  name: string;
  referral_code: string;
  total_ex_tax_business: number;
  mobile?: string;
  email?: string;
  is_active: boolean;
  created_at?: any;
}

export interface WizardOption {
  id?: string;
  label: string;
  value: string;
  position: number;
  pricing_tags?: string[];
}

export interface WizardQuestion {
  id?: string;
  question_text: string;
  input_type: "single" | "multi";
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
  created_at: any;
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
  created_at: any;
  updated_at: any;
  paid_at?: any;
}

export interface CommissionSlab {
  from: number;
  to: number | null;
  value: number;
  type: "flat" | "percent";
}
