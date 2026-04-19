import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";
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
    updated_at: null,
    updated_by: null,
  };

  let settings = defaultSettings;

  try {
    const docRef = adminDb.collection("settings").doc(SETTINGS_DOC_ID);
    const snapshot = await docRef.get();
    if (snapshot.exists) {
      const data = snapshot.data() as any;
      settings = {
        ...defaultSettings,
        ...data,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || null,
      };
    }
  } catch (err: any) {
    console.warn("⚠️ Settings query failed. Falling back to default settings for audit.", err.message);
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
