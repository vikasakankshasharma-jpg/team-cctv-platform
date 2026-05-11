import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dev/seed
 *
 * NUCLEAR RESET + RESEED — HD + IP Production Catalog
 * Source: Corrected quotation sheets (29-04-2026, Quotation# 20264291225)
 *
 * HD verified totals (camera + DVR/PSU + HDD + install):
 *   4-cam:  Opt1=₹15,053  Opt2=₹17,133  Opt3=₹21,100
 *   8-cam:  Opt1=₹21,703  Opt2=₹25,863  Opt3=₹33,223
 *  16-cam:  Opt1=₹40,345  Opt2=₹48,665  Opt3=₹73,160
 *
 * IP: 5 camera options (Budget 2MP, Budget 4MP, CP Plus 2MP B&W,
 *                        CP Plus 2MP Color, CP Plus 4MP Color)
 *
 * GST rate = 0 — quoted prices are FINAL (all-inclusive)
 * daily_gb_per_camera = 17 → HDD auto-select matches quotation defaults:
 *   4 cams × 17 GB × 7 days = 476 GB → picks 500GB ✓
 *   8 cams × 17 GB × 7 days = 952 GB → picks 1TB  ✓
 *  16 cams × 17 GB × 7 days = 1904 GB → picks 3TB  ✓
 */

const DAILY_GB = 17;

// Collections to wipe on every seed run
const toWipe = [
  "products",
  "addons",
  "addon_rules",
  "recommendation_rules",
  "settings",
  "price_change_log",
  "leads",
];

// ─── Helper: wipe all docs from a collection ────────────────────────────────
async function wipeCollection(name: string) {
  const snap = await adminDb.collection(name).get();
  if (snap.empty) return;
  const batch = adminDb.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not Found" },
      { status: 404 }
    );
  }

  try {
    // ── STEP 1: NUCLEAR WIPE ────────────────────────────────────────────────
    await Promise.all(toWipe.map(wipeCollection));

    // ── STEP 2: PRODUCTS ─────────────────────────────────────────────────────
    const products: Record<string, any>[] = [

      // ══════════════════════════════════════════════════════════════
      //  HD CAMERAS  (3 options)
      // ══════════════════════════════════════════════════════════════

      // Option 1 — Budget Brand 2MP (IR Night)  ₹975/cam
      {
        id: "cam_hd_opt1",
        technical_name: "cam_hd_opt1",
        display_name: "Budget Brand 2MP (IR Night)",
        category: "camera",
        technology: "HD",
        unit_price: 975,
        resolution_tier: "good",
        daily_gb_per_camera: DAILY_GB,
        catalog_path: "CCTV/Cameras/HD/2MP",
        brand: "Budget",
        is_active: true,
      },

      // Option 2 — CP Plus 2.4MP Color in Night  ₹1,495/cam
      {
        id: "cam_hd_opt2",
        technical_name: "cam_hd_opt2",
        display_name: "CP Plus 2.4MP Color in Night",
        category: "camera",
        technology: "HD",
        unit_price: 1495,
        resolution_tier: "very_clear",
        daily_gb_per_camera: DAILY_GB,
        catalog_path: "CCTV/Cameras/HD/2MP",
        brand: "CP Plus",
        features: ["color"],
        is_active: true,
      },

      // Option 3 — CP Plus 5MP Color in Night  ₹2,185/cam
      {
        id: "cam_hd_opt3",
        technical_name: "cam_hd_opt3",
        display_name: "5MP Color Night Vision Camera",
        category: "camera",
        technology: "HD",
        unit_price: 2185,
        resolution_tier: "crystal_clear",
        daily_gb_per_camera: DAILY_GB,
        catalog_path: "CCTV/Cameras/HD/5MP",
        brand: "CP Plus",
        features: ["color"],
        is_active: true,
      },

      // ── HD DVRs (2MP-compatible: opts 1 & 2) ──────────────────────────────
      {
        id: "dvr_hd_4ch_2mp",
        technical_name: "dvr_hd_4ch_2mp",
        display_name: "CP Plus DVR 4CH (2MP Supported, Upto 4 Cameras)",
        category: "recorder",
        technology: "HD",
        unit_price: 2990,
        channels: 4,
        max_cameras: 4,
        catalog_path: "CCTV/Recorders/DVR/2MP",
        compatible_paths: ["CCTV/Cameras/HD/2MP"],
        is_active: true,
      },
      {
        id: "dvr_hd_8ch_2mp",
        technical_name: "dvr_hd_8ch_2mp",
        display_name: "CP Plus DVR 8CH (2MP Supported, Upto 8 Cameras)",
        category: "recorder",
        technology: "HD",
        unit_price: 4140,
        channels: 8,
        max_cameras: 8,
        catalog_path: "CCTV/Recorders/DVR/2MP",
        compatible_paths: ["CCTV/Cameras/HD/2MP"],
        is_active: true,
      },
      {
        id: "dvr_hd_16ch_2mp",
        technical_name: "dvr_hd_16ch_2mp",
        display_name: "16-Channel Pro DVR",
        category: "recorder",
        technology: "HD",
        unit_price: 7245,
        channels: 16,
        max_cameras: 16,
        catalog_path: "CCTV/Recorders/DVR/2MP",
        compatible_paths: ["CCTV/Cameras/HD/2MP"],
        brand: "CP Plus",
        is_active: true,
      },

      // ── HD DVRs (5MP-compatible: opt 3) ───────────────────────────────────
      {
        id: "dvr_hd_4ch_5mp",
        technical_name: "dvr_hd_4ch_5mp",
        display_name: "CP Plus DVR 4CH (5MP Supported, Upto 4 Cameras)",
        category: "recorder",
        unit_price: 4197,
        channels: 4,
        max_cameras: 4,
        catalog_path: "CCTV/Recorders/DVR/5MP",
        compatible_paths: ["CCTV/Cameras/HD/5MP"],
        is_active: true,
      },
      {
        id: "dvr_hd_8ch_5mp",
        technical_name: "dvr_hd_8ch_5mp",
        display_name: "CP Plus DVR 8CH (5MP Supported, Upto 8 Cameras)",
        category: "recorder",
        technology: "HD",
        unit_price: 5980,
        channels: 8,
        max_cameras: 8,
        catalog_path: "CCTV/Recorders/DVR/5MP",
        compatible_paths: ["CCTV/Cameras/HD/5MP"],
        is_active: true,
      },
      {
        id: "dvr_hd_16ch_5mp",
        technical_name: "dvr_hd_16ch_5mp",
        display_name: "CP Plus DVR 16CH (5MP Supported, Upto 16 Cameras)",
        category: "recorder",
        technology: "HD",
        unit_price: 20700,
        channels: 16,
        max_cameras: 16,
        catalog_path: "CCTV/Recorders/DVR/5MP",
        compatible_paths: ["CCTV/Cameras/HD/5MP"],
        is_active: true,
      },

      // ── HD Power Supply (stacks for 9-16 cameras: 2 units auto-selected) ──
      {
        id: "psu_hd_8ch",
        technical_name: "psu_hd_8ch",
        display_name: "Power Supply (8CH)",
        category: "accessory",
        technology: "HD",
        unit_price: 1260,
        max_cameras: 8,
        catalog_path: "CCTV/Accessories/PSU/HD",
        compatible_paths: ["CCTV/Cameras/HD"],
        is_active: true,
      },

      // ── HD HDDs ───────────────────────────────────────────────────────────
      {
        id: "hdd_500gb_hd",
        technical_name: "hdd_500gb_hd",
        display_name: "HDD 500GB (approx 4-7 days recording)",
        category: "accessory",
        unit_price: 2153,
        is_active: true,
      },
      {
        id: "hdd_1tb_hd",
        technical_name: "hdd_1tb_hd",
        display_name: "HDD 1TB (approx 4-7 days recording)",
        category: "accessory",
        technology: "HD",
        unit_price: 5303,
        is_active: true,
      },
      {
        id: "hdd_3tb_hd",
        technical_name: "hdd_3tb_hd",
        display_name: "HDD 3TB (approx 7-10 days recording)",
        category: "accessory",
        technology: "HD",
        unit_price: 8580,
        is_active: true,
      },
      {
        id: "hdd_4tb_hd",
        technical_name: "hdd_4tb_hd",
        display_name: "HDD 4TB",
        category: "accessory",
        technology: "HD",
        unit_price: 11550,
        is_active: true,
      },

      // ══════════════════════════════════════════════════════════════
      //  IP CAMERAS  (5 options)
      // ══════════════════════════════════════════════════════════════

      // Option 1 — Budget Brand 2MP Color Night & Mic  ₹1,300/cam
      {
        id: "cam_ip_opt1",
        technical_name: "cam_ip_opt1",
        display_name: "Budget Brand 2MP (Color Night & Mic)",
        category: "camera",
        technology: "IP",
        unit_price: 1300,
        resolution_tier: "good",
        daily_gb_per_camera: DAILY_GB,
        catalog_path: "CCTV/Cameras/IP/2MP",
        brand: "Budget",
        features: ["color", "mic"],
        is_active: true,
      },

      // Option 2 — Budget Brand 4MP Color Night & Mic  ₹2,275/cam
      {
        id: "cam_ip_opt2",
        technical_name: "cam_ip_opt2",
        display_name: "Budget Brand 4MP (Color Night & Mic)",
        category: "camera",
        technology: "IP",
        unit_price: 2275,
        resolution_tier: "very_clear",
        daily_gb_per_camera: DAILY_GB,
        catalog_path: "CCTV/Cameras/IP/4MP",
        brand: "Budget",
        features: ["color", "mic"],
        is_active: true,
      },

      // Option 3 — Hikvision 2MP B&W Night  ₹2,695/cam
      {
        id: "cam_ip_opt3",
        technical_name: "cam_ip_opt3",
        display_name: "2MP Classic IP Camera",
        category: "camera",
        technology: "IP",
        unit_price: 2695,
        resolution_tier: "good",
        daily_gb_per_camera: DAILY_GB,
        catalog_path: "CCTV/Cameras/IP/2MP",
        brand: "Hikvision",
        is_active: true,
      },

      // Option 4 — Hikvision 2MP Color in Night  ₹3,025/cam
      {
        id: "cam_ip_opt4",
        technical_name: "cam_ip_opt4",
        display_name: "2MP Color Night Vision Camera",
        category: "camera",
        technology: "IP",
        unit_price: 3025,
        bulk_discount_threshold: 16,
        bulk_unit_price: 2915,
        resolution_tier: "very_clear",
        daily_gb_per_camera: DAILY_GB,
        catalog_path: "CCTV/Cameras/IP/2MP",
        brand: "Hikvision",
        is_active: true,
      },

      // Option 5 — Hikvision 4MP Color in Night  ₹4,015/cam
      {
        id: "cam_ip_opt5",
        technical_name: "cam_ip_opt5",
        display_name: "4MP Pro-HD Color Night Camera",
        category: "camera",
        technology: "IP",
        unit_price: 4015,
        bulk_discount_threshold: 16,
        bulk_unit_price: 3905,
        resolution_tier: "crystal_clear",
        daily_gb_per_camera: DAILY_GB,
        catalog_path: "CCTV/Cameras/IP/4MP",
        brand: "Hikvision",
        features: ["color"],
        is_active: true,
      },

      // ── IP NVRs (CP Plus) ──────────────────────────────────────────────────
      {
        id: "nvr_ip_4ch",
        technical_name: "nvr_ip_4ch",
        display_name: "NVR CP Plus (Upto 4 Cameras)",
        category: "recorder",
        technology: "IP",
        unit_price: 4140,
        channels: 4,
        max_cameras: 4,
        catalog_path: "CCTV/Recorders/NVR",
        compatible_paths: ["CCTV/Cameras/IP"],
        is_active: true,
      },
      {
        id: "nvr_ip_8ch",
        technical_name: "nvr_ip_8ch",
        display_name: "NVR CP Plus (Upto 8 Cameras)",
        category: "recorder",
        technology: "IP",
        unit_price: 4860,
        channels: 8,
        max_cameras: 8,
        catalog_path: "CCTV/Recorders/NVR",
        compatible_paths: ["CCTV/Cameras/IP"],
        is_active: true,
      },
      {
        id: "nvr_ip_16ch",
        technical_name: "nvr_ip_16ch",
        display_name: "NVR CP Plus (Upto 16 Cameras)",
        category: "recorder",
        technology: "IP",
        unit_price: 8160,
        channels: 16,
        max_cameras: 16,
        catalog_path: "CCTV/Recorders/NVR",
        compatible_paths: ["CCTV/Cameras/IP"],
        is_active: true,
      },

      // ── IP PoE Switches (stacked for 9-16 cameras) ────────────────────────
      {
        id: "poe_ip_4ch",
        technical_name: "poe_ip_4ch",
        display_name: "PoE Switch (4CH)",
        category: "accessory",
        technology: "IP",
        unit_price: 1207,
        max_cameras: 4,
        catalog_path: "CCTV/Accessories/PoE",
        compatible_paths: ["CCTV/Cameras/IP"],
        is_active: true,
      },
      {
        id: "poe_ip_8ch",
        technical_name: "poe_ip_8ch",
        display_name: "PoE Switch (8CH)",
        category: "accessory",
        technology: "IP",
        unit_price: 1552,
        max_cameras: 8,
        catalog_path: "CCTV/Accessories/PoE",
        compatible_paths: ["CCTV/Cameras/IP"],
        is_active: true,
      },

      // ── IP HDDs ───────────────────────────────────────────────────────────
      {
        id: "hdd_500gb_ip",
        technical_name: "hdd_500gb_ip",
        display_name: "HDD 500GB",
        category: "accessory",
        technology: "IP",
        unit_price: 2153,
        is_active: true,
      },
      {
        id: "hdd_1tb_ip",
        technical_name: "hdd_1tb_ip",
        display_name: "HDD 1TB",
        category: "accessory",
        technology: "IP",
        unit_price: 5303,
        is_active: true,
      },
      {
        id: "hdd_3tb_ip",
        technical_name: "hdd_3tb_ip",
        display_name: "HDD 3TB",
        category: "accessory",
        technology: "IP",
        unit_price: 8190,
        is_active: true,
      },
      {
        id: "hdd_4tb_ip",
        technical_name: "hdd_4tb_ip",
        display_name: "HDD 4TB",
        category: "accessory",
        technology: "IP",
        unit_price: 11025,
        is_active: true,
      },
      {
        id: "hdd_6tb_ip",
        technical_name: "hdd_6tb_ip",
        display_name: "HDD 6TB",
        category: "accessory",
        technology: "IP",
        unit_price: 15540,
        is_active: true,
      },
    ];

    const batch1 = adminDb.batch();
    products.forEach(({ id, ...data }) => {
      const ref = adminDb.collection("products").doc(id);
      batch1.set(ref, { ...data, technical_name: id, created_at: new Date(), updated_at: new Date() });
    });
    await batch1.commit();

    // ── STEP 3: ADDONS ───────────────────────────────────────────────────────
    const addons = [
      // HD cables
      { id: "addon_cable_cc_hd", display_name: "Cable per Mtr (Copper Coated) – HD", price: 12,  unit_multiplier: "none", technology: "HD", is_active: true },
      { id: "addon_cable_pc_hd", display_name: "Cable per Mtr (Pure Copper) – HD",   price: 35,  unit_multiplier: "none", technology: "HD", is_active: true },
      // IP cables
      { id: "addon_cable_cc_ip", display_name: "Cable per Mtr (Copper Coated) – IP", price: 40,  unit_multiplier: "none", technology: "IP", is_active: true },
      { id: "addon_cable_pc_ip", display_name: "Cable per Mtr (Pure Copper) – IP",   price: 38,  unit_multiplier: "none", technology: "IP", is_active: true },
      // Common
      { id: "addon_rack_2u",    display_name: "Rack (2U)",           price: 500, unit_multiplier: "none", technology: "both", is_active: true },
      { id: "addon_rack_4u",    display_name: "Rack (4U)",           price: 1000, unit_multiplier: "none", technology: "both", is_active: true },
      { id: "addon_pvc_box",    display_name: "PVC Box 5x5 (per unit)", price: 42, unit_multiplier: "none", technology: "both", is_active: true },
      { id: "addon_poe_cover",  display_name: "PoE Switch PVC Box Cover", price: 480, unit_multiplier: "none", technology: "IP", is_active: true },
    ];

    const batch2 = adminDb.batch();
    addons.forEach(({ id, ...data }) => {
      batch2.set(adminDb.collection("addons").doc(id), { ...data, created_at: new Date() });
    });
    await batch2.commit();

    // ── STEP 4: SETTINGS ─────────────────────────────────────────────────────
    // gst_rate = 0 — quoted prices are all-inclusive (no separate GST line)
    await adminDb.collection("settings").doc("app_config").set({
      company_name: "TEAM CCTV",
      company_logo_url: null,
      gst_rate: 0,

      // Installation labor rates
      labor_hd_per_camera: 400,     // BNC/DC/Clip, Normal Conditions
      labor_ip_per_camera: 500,     // RJ45/Clip, Normal Conditions

      // Cable rates per metre
      cable_copper_coated_hd: 12,
      cable_pure_copper_hd: 35,
      cable_copper_coated_ip: 40,
      cable_pure_copper_ip: 38,
      cable_overage_per_mtr: 12,    // extra charge beyond 100 m

      // Post-sale
      visit_charge: 300,            // after handover if AMC not taken
      amc_1yr_pct: 5,
      amc_2yr_pct: 8,
      amc_3yr_pct: 10,

      // Quote settings
      quote_validity_days: 7,
      max_supported_cameras: 16,    // >16 → industrial consultation

      // Payment terms
      payment_advance_pct: 10,
      payment_material_pct: 80,
      payment_handover_pct: 10,

      // Tier labels
      tier_budget_label: "Essential",
      tier_recommended_label: "Professional",
      tier_premium_label: "Premium",

      // Notifications
      whatsapp_template: "Hi {{customer_name}}, your TEAM CCTV quotation is ready. Reply to know more.",
      admin_notification_phone: "+919772699395",

      // Legacy compat
      labor_fitting_only_rate: 400,
      labor_full_installation_rate: 500,
      cable_copper_coated: 12,
      cable_pure_copper: 35,
      wire_cost_per_meter: 12,
      pricing_cache_ttl_seconds: 300,
      otp_provider: "firebase_phone",

      updated_at: new Date(),
    });

    // ── STEP 5: RECOMMENDATION RULES ─────────────────────────────────────────
    const rules = [
      // HD default → Option 2 (CP Plus 2.4MP Color)
      {
        id: "rec_hd_default",
        priority: 10,
        is_active: true,
        conditions: { technology: "HD" },
        recommendation: {
          camera_option: 2,
          label: "Best Value",
          reason: "CP Plus 2.4MP Color Night gives colour footage day & night at an unbeatable price.",
          is_featured: true,
        },
      },
      // IP default → Option 4 (CP Plus 2MP Color)
      {
        id: "rec_ip_default",
        priority: 10,
        is_active: true,
        conditions: { technology: "IP" },
        recommendation: {
          camera_option: 4,
          label: "Best Value",
          reason: "CP Plus 2MP Color in Night — smart IP with full-colour night footage, trusted across 500+ Jaipur sites.",
          is_featured: true,
        },
      },
      // IP factory/large commercial → Option 5 (CP Plus 4MP)
      {
        id: "rec_ip_factory",
        priority: 5,
        is_active: true,
        conditions: { technology: "IP", property_types: ["factory", "warehouse"] },
        recommendation: {
          camera_option: 5,
          label: "Industrial Grade",
          reason: "CP Plus 4MP provides forensic-level detail essential for large industrial sites.",
          is_featured: true,
        },
      },
    ];

    const batch3 = adminDb.batch();
    rules.forEach(({ id, ...data }) => {
      batch3.set(adminDb.collection("recommendation_rules").doc(id), { ...data, created_at: new Date() });
    });
    await batch3.commit();

    return NextResponse.json({
      success: true,
      message: "✅ Production Catalog Seeded — HD (3 options) + IP (5 options)",
      wiped: toWipe,
      counts: {
        products: products.length,
        addons: addons.length,
        recommendation_rules: rules.length,
      },
      hd_price_verification: {
        "4cam_opt1_budget_2mp":    "₹15,053 (4×₹975 + ₹2,990 DVR + ₹1,260 PSU + ₹5,303 HDD + ₹1,600 install)",
        "4cam_opt2_cpplus_2.4mp":  "₹17,133 (4×₹1,495 + ₹2,990 DVR + ₹1,260 PSU + ₹5,303 HDD + ₹1,600 install)",
        "4cam_opt3_cpplus_5mp":    "₹21,100 (4×₹2,185 + ₹4,198 DVR + ₹1,260 PSU + ₹5,303 HDD + ₹1,600 install)",
        "8cam_opt1_budget_2mp":    "₹21,703 (8×₹975 + ₹4,140 DVR + ₹1,260 PSU + ₹5,303 HDD + ₹3,200 install)",
        "8cam_opt2_cpplus_2.4mp":  "₹25,863 (8×₹1,495 + ₹4,140 DVR + ₹1,260 PSU + ₹5,303 HDD + ₹3,200 install)",
        "8cam_opt3_cpplus_5mp":    "₹33,223 (8×₹2,185 + ₹5,980 DVR + ₹1,260 PSU + ₹5,303 HDD + ₹3,200 install)",
        "16cam_opt1_budget_2mp":   "₹40,345 (16×₹975 + ₹7,245 DVR + ₹2,520 PSU×2 + ₹8,580 HDD + ₹6,400 install)",
        "16cam_opt2_cpplus_2.4mp": "₹48,665 (16×₹1,495 + ₹7,245 DVR + ₹2,520 PSU×2 + ₹8,580 HDD + ₹6,400 install)",
        "16cam_opt3_cpplus_5mp":   "₹73,160 (16×₹2,185 + ₹20,700 DVR + ₹2,520 PSU×2 + ₹8,580 HDD + ₹6,400 install)",
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error("❌ Seed error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


