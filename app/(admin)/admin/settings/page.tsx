import { requireSuperAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/constants";
import { Settings2 } from "lucide-react";
import type { AppSettings } from "@/types";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { PageHeader } from "@/components/admin/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Configuration | Command Centre",
  description: "Configure company branding, GST rates, labor costs, and communication templates.",
};

export const dynamic = "force-dynamic";

export default async function SettingsAdminPage() {
  await requireSuperAdmin();

  // Default values if the document hasn't been created yet
  const defaultSettings: AppSettings = {
    company_name: "TEAM CCTV",
    company_legal_name: "TEAM CCTV",
    company_tagline: "Premium Security Solutions",
    company_logo_url: null,
    company_address_line1: "",
    company_address_line2: "",
    company_city: "Jaipur",
    company_state: "Rajasthan",
    company_state_code: "08",
    company_pincode: "302001",
    company_gstin: "",
    company_pan: "",
    company_phone: "+91 98290 00000",
    company_email: "sales@teamcctv.com",
    company_website: "cctvquotation.com",
    bank_name: "HDFC Bank",
    bank_account_name: "TEAM CCTV SOLUTIONS",
    bank_account_no: "50200062325372",
    bank_ifsc: "HDFC0001844",
    bank_branch: "Jaipur",
    bank_upi_id: "teamcctv@okhdfc",
    authorized_signatory_label: "Authorised Signatory — TEAM CCTV",
    jurisdiction_city: "Jaipur",
    gst_rate: 18,
    whatsapp_template: "Hello {{customer_name}},\n\nHere is your custom CCTV quotation from {{company_name}}.\n\nTotal Payable: ₹{{total_amount}}\n\nDownload your PDF: {{pdf_url}}\n\nThank you!",
    pricing_cache_ttl_seconds: 3600,
    otp_provider: "firebase_phone",
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

    // NEW: High-Fidelity Logic (Real PDF Alignment)
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
    connector_rj45_cost: 5, // Purchase cost per piece (price list)
    connector_bnc_dc_cost: 20, // BNC ₹15 + DC ₹5 = ₹20 per camera (purchase cost)
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
    margin_microsd: 20,

    // Wireless & Smart Wi-Fi Controls
    labor_wireless_pro_per_camera: 349,
    labor_wireless_diy: 0,
    wireless_auto_multiply_storage: true,
    wireless_max_sd_capacity_gb: 256,
    bitrate_daily_gb_2mp: 8.0,
    bitrate_daily_gb_4mp: 14.0,
    bitrate_daily_gb_8mp: 22.0,

    // NEW: Pincode and Cabling Config
    affordable_pincodes: ["302001", "302002", "302003", "302004", "302005", "302006", "302015", "302016"],
    default_cable_length_per_camera: 20,

    promoter_commission_percent: 2,
    customer_referral_discount_percent: 3,

    system_mode: "LIVE",
    payments_enabled: true,

    updated_at: null,
    updated_by: null,
  };

  let settings = defaultSettings;

  try {
    const docRef = adminDb.collection("settings").doc(SETTINGS_DOC_ID);
    const snapshot = await docRef.get();
    if (snapshot.exists) {
      const data = snapshot.data();
      if (data) {
        settings = {
          ...defaultSettings,
          ...data,
          site_preparation: {
            ...defaultSettings.site_preparation,
            ...(data.site_preparation || {})
          },
          updated_at: (data.updated_at as any)?.toDate?.()?.toISOString() || data.updated_at || null,
        } as AppSettings;
      }
    }
  } catch (err) {
    const error = err as Error;
    console.warn("⚠️ Settings query failed. Falling back to default settings for audit.", error.message);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings2}
        title="Global Configuration"
        description="Configure company branding, GST rates, labor costs, and communication templates."
      />

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
