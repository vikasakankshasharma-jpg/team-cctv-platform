import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/constants";
import { AppSettings } from "@/types";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  company_name: "TEAM CCTV",
  company_logo_url: "",
  gst_rate: 18,
  labor_fitting_only_rate: 500,
  labor_full_installation_rate: 1200,
  wire_cost_per_meter: 25,
  brand_tabs_order: ["all", "budget", "cpplus", "hikvision", "dahua"],
  tier_budget_label: "VALUE:",
  tier_budget_multiplier: 0.85,
  tier_recommended_label: "PROFESSIONAL:",
  tier_recommended_multiplier: 1.0,
  tier_premium_label: "ELITE:",
  tier_premium_multiplier: 1.25,

  // Technical Logic
  max_supported_cameras: 16,
  labor_ip_per_camera: 500,
  labor_hd_per_camera: 400,

  // Existing Cabling (No Cabling Required) Labor & Visit Charges
  labor_hd_fitting_only: 200,
  labor_ip_fitting_only: 300,
  labor_no_cabling_visit_charge: 500,
  labor_no_cabling_small_job_threshold: 2,
  labor_no_cabling_small_job_rate: 500,

  // Site Preparation & Difficulty Surcharges (0% Margin Pass-Through)
  site_preparation: {
    ladderArrangementFee: 500,
    marbleLaborSurcharge: 400,
    metalInstallationSurcharge: 200,
    furnishedSiteSurcharge: 300,
    heavyWallDrillingSurcharge: 600,
  },

  cable_copper_coated_ip: 40,
  cable_copper_coated_hd: 25,
  cable_pure_copper: 65,
  connector_rj45_cost: 5,
  connector_bnc_dc_cost: 20,
  cable_overage_per_mtr: 12,
  conduit_cost_per_meter: 20,
  visit_charge: 300,
  amc_1yr_pct: 5,
  amc_2yr_pct: 8,
  amc_3yr_pct: 10,
  quote_validity_days: 8,

  // Hardware Component Margins (%)
  margin_hdd: 5,
  margin_hdd_budget: 10,
  margin_cctv_camera: 15,
  margin_cctv_camera_budget: 30,
  margin_recorder: 15,
  margin_junction_box: 50,
  margin_connectors: 50,
  margin_hdmi_cable: 20,
  margin_rack: 30,
  margin_power_supply: 25,

  affordable_pincodes: ["302001", "302002", "302003", "302004", "302005", "302006", "302015", "302016"],
  default_cable_length_per_camera: 20,
  promoter_commission_percent: 2,
  customer_referral_discount_percent: 3,

  system_mode: "LIVE",
  payments_enabled: true,
  whatsapp_template: "",
  pricing_cache_ttl_seconds: 3600,
  otp_provider: "firebase_phone",
};

export function mergeAppSettings(raw: Partial<AppSettings> | null | undefined): AppSettings {
  if (!raw) return { ...DEFAULT_APP_SETTINGS };
  return {
    ...DEFAULT_APP_SETTINGS,
    ...raw,
    site_preparation: {
      ...DEFAULT_APP_SETTINGS.site_preparation,
      ...(raw.site_preparation || {}),
    },
  };
}

export const getCachedAdminSettings = unstable_cache(
  async (): Promise<AppSettings> => {
    try {
      const doc = await adminDb.collection("settings").doc(SETTINGS_DOC_ID).get();
      if (doc.exists) {
        return mergeAppSettings(doc.data() as AppSettings);
      }
    } catch (err) {
      console.warn("⚠️ Failed to fetch Firestore settings, falling back to defaults:", err);
    }
    return mergeAppSettings(null);
  },
  ["admin_settings"],
  { revalidate: 3600, tags: ["settings"] }
);
