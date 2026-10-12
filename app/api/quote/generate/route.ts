import { getCachedProducts, getCachedAddons } from "@/lib/cached-catalog";
import { getCachedAdminSettings } from "@/lib/cached-settings";
import { NextResponse } from "next/server";
import { CCTVRequirement, AppSettings, Product, Addon } from "@/types";
import { generateConfiguration } from "@/lib/configuration-engine";
import { resolveProducts } from "@/lib/product-resolver";
import { generatePricingSnapshot } from "@/lib/pricing-engine";
import { adminDb } from "@/lib/firebase-admin";

async function getActiveProducts(): Promise<Product[]> {
  const snap = await adminDb
    .collection("products")
    .where("is_active", "==", true)
    
    .get();

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)).filter(p => p.is_quotation_eligible !== false);
}

async function getActiveAddons(): Promise<Addon[]> {
  const snap = await adminDb
    .collection("addons")
    .where("is_active", "==", true)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon));
}

export async function POST(request: Request) {
  console.log("HELLO FROM QUOTE GENERATE API");
  try {
    const req: CCTVRequirement = await request.json();

    // 1. Fetch dependencies (Catalog, Settings, Addons)
    const settings = await getCachedAdminSettings();
    const catalog = await getCachedProducts();
    const addons = await getCachedAddons(); // Cast safely for now

    // 2. Requirements -> Engineering Configuration
    const config = generateConfiguration(req);

    
    // Resolve Referral Code to Discounts
    let referralDiscountPercent = 0;
    let referralDiscountFlat = 0;
    if (req.partner_id) {
      const promoterSnap = await adminDb
        .collection("promoters")
        .where("referral_code", "==", req.partner_id.toUpperCase().trim())
        .where("is_active", "==", true)
        .limit(1)
        .get();
      if (!promoterSnap.empty) {
        const promoter = promoterSnap.docs[0].data();
        if (promoter.discount_type === "flat") {
          referralDiscountFlat = promoter.discount_value || 0;
        } else {
          referralDiscountPercent = promoter.discount_value || 0;
        }
      }
    }

    // 3. Extract unique brands from catalog
    const brands = new Set<string>();
    catalog.forEach((p: Product) => {
       if (p.category === "cctv_camera" || p.category === "recorder" || (p.category as any) === "CAMERA_HD" || (p.category as any) === "CAMERA_IP") {
                    let b = p.brand;
          if (!b) {
             if (p.display_name.toLowerCase().includes("cp plus")) b = "CP Plus";
             else if (p.display_name.toLowerCase().includes("hikvision")) b = "Hikvision";
             else if (p.display_name.toLowerCase().includes("prama")) b = "Prama";
             else if (p.display_name.toLowerCase().includes("dahua")) b = "Dahua";
          }
          if (b) {
             const lower = b.toLowerCase().replace(/\s+/g, "");
             if (lower === "cpplus") b = "CP Plus";
             else if (lower.includes("budget")) b = "";
             else if (lower === "prama") b = "Prama";
             else if (lower === "hikvision") b = "Hikvision";
             else if (lower === "dahua") b = "Dahua";
          }
          if (b) brands.add(b);
       }
    });
    const uniqueBrands = Array.from(brands);

    // 4. Resolve Hardware (Dynamic Tech+MP Combinations) for "Budget" + Each Brand
    let allResolvedPlans: Record<string, any> = {};
    const lifecycleWarnings: string[] = [];

    // Run for "Budget"
    const budgetRes = resolveProducts(config, req, catalog, "Budget");
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

    // 5. Resolved Hardware → Pricing
    const quotePlans: Record<string, any> = {};
    // Extract addon IDs from the requirement (wizard selections like monitor, UPS, etc.)
    const selectedAddonIds: string[] = Array.isArray((req as any).selected_addons) ? (req as any).selected_addons : [];
    for (const [key, resolvedSystem] of Object.entries(allResolvedPlans)) {
       const isBudget = key.startsWith("Budget_");
       quotePlans[key] = generatePricingSnapshot(
         { ...resolvedSystem, plan_type: isBudget ? "budget" : "recommended" },
         req,
         addons,
         selectedAddonIds,
         settings,
         undefined,
         referralDiscountPercent,
         referralDiscountFlat,
         catalog
       );
    }

    // 5. Construct final response
    return NextResponse.json({
      success: true,
      requirement: req,
      configuration: config,
      plans: quotePlans,
      addons: addons,
      storageDrives: catalog.filter((p: Product) => p.category === "storage"),
      lifecycleWarnings
    });
  } catch (error: any) {
    console.error("Quote generation error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}


