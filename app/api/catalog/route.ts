import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { MarginEngine, DEFAULT_MARGIN_POLICY } from "@/lib/margin-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const applyRetailMargins = searchParams.get("retail") === "true";

    const [prodSnap, addonSnap, settingsSnap] = await Promise.all([
      adminDb.collection("products").where("is_active", "==", true).get(),
      adminDb.collection("addons").where("is_active", "==", true).get(),
      adminDb.collection("settings").doc("app_config").get()
    ]);
    
    const settings = settingsSnap.exists ? settingsSnap.data() : {};

    const marginPolicy: any = applyRetailMargins ? {
      ...DEFAULT_MARGIN_POLICY,
      ...((settings as any)?.margin_policy || {}),
      margin_hdd: settings?.margin_hdd ?? (settings as any)?.margin_policy?.margin_hdd ?? DEFAULT_MARGIN_POLICY.margin_hdd,
      margin_hdd_budget: settings?.margin_hdd_budget ?? (settings as any)?.margin_policy?.margin_hdd_budget ?? DEFAULT_MARGIN_POLICY.margin_hdd_budget,
      margin_cctv_camera: settings?.margin_cctv_camera ?? (settings as any)?.margin_policy?.margin_cctv_camera ?? DEFAULT_MARGIN_POLICY.margin_cctv_camera,
      margin_cctv_camera_budget: settings?.margin_cctv_camera_budget ?? (settings as any)?.margin_policy?.margin_cctv_camera_budget ?? DEFAULT_MARGIN_POLICY.margin_cctv_camera_budget,
      margin_recorder: settings?.margin_recorder ?? (settings as any)?.margin_policy?.margin_recorder ?? DEFAULT_MARGIN_POLICY.margin_recorder,
      margin_junction_box: settings?.margin_junction_box ?? (settings as any)?.margin_policy?.margin_junction_box ?? DEFAULT_MARGIN_POLICY.margin_junction_box,
      margin_connectors: settings?.margin_connectors ?? (settings as any)?.margin_policy?.margin_connectors ?? DEFAULT_MARGIN_POLICY.margin_connectors,
      margin_hdmi_cable: settings?.margin_hdmi_cable ?? (settings as any)?.margin_policy?.margin_hdmi_cable ?? DEFAULT_MARGIN_POLICY.margin_hdmi_cable,
      margin_rack: settings?.margin_rack ?? (settings as any)?.margin_policy?.margin_rack ?? DEFAULT_MARGIN_POLICY.margin_rack,
      margin_power_supply: settings?.margin_power_supply ?? (settings as any)?.margin_policy?.margin_power_supply ?? DEFAULT_MARGIN_POLICY.margin_power_supply,
    } : null;

    const processItemPrice = (data: any, defaultCat: string) => {
      let baseCost = data.base_cost || data.price || data.unit_price || 0;
      if (!applyRetailMargins) return baseCost;
      
      const cat = (data.category || defaultCat).toLowerCase();
      if (cat === "cable") {
          const cableMarginPct = (settings as any).margin_cable ?? 50;
          return Math.round(baseCost * (1 + cableMarginPct / 100));
      } else if (cat === "labor" || cat === "installation") {
          return baseCost;
      } else if (cat.includes("surcharge")) {
          return Math.round(baseCost);
      } else {
          const isStorage = cat.includes("storage") || cat.includes("hdd") || cat.includes("hard disk") || (data.storage_type && data.storage_type.toLowerCase().includes("hard disk"));
          const effectiveCat = isStorage ? "storage" : (cat || "cctv_camera");
          const calc = MarginEngine.calculateUnitPricing(baseCost, effectiveCat, "recommended", marginPolicy, data.brand);
          return calc.sellingPriceExTax;
      }
    };

    const items: any[] = [];
    
    prodSnap.forEach(doc => {
      const data = doc.data() as any;
      if (data.is_deleted === true) return;
      if (!Array.isArray(data.technologies)) {
        data.technologies = data.technology ? [data.technology] : ["Common"];
      }
      items.push({ id: doc.id, ...data, unit_price: processItemPrice(data, "cctv_camera"), type: "product" });
    });

    addonSnap.forEach(doc => {
      const data = doc.data();
      if (data.is_deleted === true) return;
      items.push({ 
        id: doc.id, 
        ...data,
        unit_price: processItemPrice(data, data.category || "accessory"),
        category: data.category || "accessory",
        technologies: data.technology ? [data.technology] : ["Common"],
        type: "addon"
      });
    });

    const laborHd = settings?.labor_hd_per_camera || 400;
    const laborIp = settings?.labor_ip_per_camera || 500;

    items.push({
      id: "PRO_INSTALL_HD",
      display_name: "Professional Installation (HD)",
      category: "installation",
      technologies: ["HD"],
      unit_price: laborHd,
      unit_multiplier: "camera_count",
      type: "service"
    });
    
    items.push({
      id: "PRO_INSTALL_IP",
      display_name: "Professional Installation (IP)",
      category: "installation",
      technologies: ["IP"],
      unit_price: laborIp,
      unit_multiplier: "camera_count",
      type: "service"
    });

    return NextResponse.json({ success: true, products: items });
  } catch (error) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch catalog" }, { status: 500 });
  }
}
