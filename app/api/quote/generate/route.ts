import { NextResponse } from "next/server";
import { CCTVRequirement, AppSettings, Product, Addon } from "@/types";
import { generateConfiguration } from "@/lib/configuration-engine";
import { resolveProducts } from "@/lib/product-resolver";
import { generatePricingSnapshot } from "@/lib/pricing-engine-v2";

import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/constants";

async function getAdminSettings(): Promise<AppSettings> {
  const doc = await adminDb.collection("settings").doc(SETTINGS_DOC_ID).get();
  if (doc.exists) {
    return doc.data() as AppSettings;
  }
  // Fallback if missing
  return {
    company_name: "TEAM CCTV",
    company_logo_url: "",
    gst_rate: 18,
    labor_fitting_only_rate: 300,
    labor_full_installation_rate: 500,
    wire_cost_per_meter: 12,
    whatsapp_template: "",
    pricing_cache_ttl_seconds: 0,
    otp_provider: "firebase_phone",
    tier_budget_label: "Lowest",
    tier_budget_multiplier: 1,
    tier_recommended_label: "Recommended",
    tier_recommended_multiplier: 1.2,
    tier_premium_label: "Premium",
    tier_premium_multiplier: 1.5,
    max_supported_cameras: 32,
    labor_ip_per_camera: 500,
    labor_hd_per_camera: 400,
    cable_copper_coated_ip: 12,
    cable_copper_coated_hd: 8,
    cable_pure_copper: 20,
    connector_rj45_cost: 25,
    connector_bnc_dc_cost: 70,
    cable_overage_per_mtr: 15,
    visit_charge: 500,
    amc_1yr_pct: 15,
    amc_2yr_pct: 25,
    amc_3yr_pct: 35,
    quote_validity_days: 7,
  } as AppSettings;
}

async function getActiveProducts(): Promise<Product[]> {
  const snap = await adminDb
    .collection("products")
    .where("is_active", "==", true)
    .where("is_quotation_eligible", "==", true)
    .get();

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

async function getActiveAddons(): Promise<Addon[]> {
  const snap = await adminDb
    .collection("addons")
    .where("is_active", "==", true)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon));
}

export async function POST(request: Request) {
  try {
    const req: CCTVRequirement = await request.json();

    // 1. Fetch dependencies (Catalog, Settings, Addons)
    const settings = await getAdminSettings();
    const catalog = await getActiveProducts();
    const addons = (await getActiveAddons()) as any; // Cast safely for now

    // 2. Requirements -> Engineering Configuration
    const config = generateConfiguration(req);

    
    // 3. Extract unique brands from catalog
    const brands = new Set<string>();
    catalog.forEach(p => {
       if (p.category === "cctv_camera" || p.category === "recorder" || (p.category as any) === "CAMERA_HD" || (p.category as any) === "CAMERA_IP") {
          if (p.brand) brands.add(p.brand);
          else if (p.display_name.toLowerCase().includes("cp plus")) brands.add("CP Plus");
          else if (p.display_name.toLowerCase().includes("hikvision")) brands.add("Hikvision");
          else if (p.display_name.toLowerCase().includes("prama")) brands.add("Prama");
          else if (p.display_name.toLowerCase().includes("dahua")) brands.add("Dahua");
       }
    });
    const uniqueBrands = Array.from(brands);

    // 4. Resolve Hardware (Dynamic Tech+MP Combinations) for "Budget" (No Brand Filter) + Each Brand
    let allResolvedPlans: Record<string, any> = {};
    const lifecycleWarnings: string[] = [];

    // Run for "Budget"
    const budgetRes = resolveProducts(config, req, catalog);
    Object.entries(budgetRes.plans).forEach(([key, plan]) => {
        allResolvedPlans["Budget_" + key] = plan;
    });
    lifecycleWarnings.push(...budgetRes.lifecycleWarnings);

    // Run for each brand
    uniqueBrands.forEach(brand => {
       const brandRes = resolveProducts(config, req, catalog, brand);
       Object.entries(brandRes.plans).forEach(([key, plan]) => {
           allResolvedPlans[brand + "_" + key] = plan;
       });
       lifecycleWarnings.push(...brandRes.lifecycleWarnings);
    });

    // 5. Resolved Hardware -> Pricing
    const quotePlans: Record<string, any> = {};
    for (const [key, resolvedSystem] of Object.entries(allResolvedPlans)) {
       quotePlans[key] = generatePricingSnapshot(
         resolvedSystem,
         req,
         addons,
         [],
         settings
       );
    }

    // 5. Construct final response
    return NextResponse.json({
      success: true,
      requirement: req,
      configuration: config,
      plans: quotePlans,
      addons: addons,
      lifecycleWarnings
    });
  } catch (error: any) {
    console.error("Quote generation error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}