import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/constants";
import type { AppSettings } from "@/types";
import { Metadata } from "next";
import CatalogManagerClient from "./CatalogManagerClient";

export const metadata: Metadata = {
  title: "Unified Catalog & Pricing Manager | Command Centre",
  description: "Manage Hardware Catalog, Service Pricing, and Addons in one unified dashboard.",
};

export const dynamic = "force-dynamic";

export default async function CatalogManagerPage() {
  await requireAdmin();

  // Default values if the document hasn't been created yet
  const defaultSettings: AppSettings = {
    company_name: "TEAM CCTV",
    company_logo_url: null,
    gst_rate: 18,
    whatsapp_template: "Hello {{customer_name}},\n\nHere is your custom CCTV quotation from {{company_name}}.\n\nTotal Payable: ₹{{total_amount}}\n\nDownload your PDF: {{pdf_url}}\n\nThank you!",
    pricing_cache_ttl_seconds: 3600,
    otp_provider: "firebase_phone",
    labor_fitting_only_rate: 500,
    labor_full_installation_rate: 1200,
    wire_cost_per_meter: 25,
    tier_budget_label: "VALUE:",
    tier_budget_multiplier: 0.85,
    tier_recommended_label: "PROFESSIONAL:",
    tier_recommended_multiplier: 1.0,
    tier_premium_label: "ELITE:",
    tier_premium_multiplier: 1.25,
    max_supported_cameras: 16,
    labor_ip_per_camera: 500,
    labor_hd_per_camera: 400,
    cable_copper_coated_ip: 40,
    cable_copper_coated_hd: 12,
    cable_pure_copper: 38,
    cable_overage_per_mtr: 12,
    visit_charge: 300,
    amc_1yr_pct: 5,
    amc_2yr_pct: 8,
    amc_3yr_pct: 10,
    quote_validity_days: 8,
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
          updated_at: (data.updated_at as any)?.toDate?.()?.toISOString() || data.updated_at || null,
        } as AppSettings;
      }
    }
  } catch (err) {
    console.warn("⚠️ Settings query failed. Falling back to default settings.", err);
  }

  return <CatalogManagerClient initialSettings={settings} />;
}
