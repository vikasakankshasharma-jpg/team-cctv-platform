import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Product } from "@/types";
import { generatePricingSnapshot } from "@/lib/pricing-engine";
import { getApiMessage, resolveRequestLocale } from "@/lib/i18n/api-messages";

export async function POST(request: Request) {
  let locale = resolveRequestLocale(request);
  try {
    const body = await request.json() as { selections: any[], existingEquipment?: { cameras: number, recorderChannels: number }, preferred_language?: string, locale?: string };
    locale = resolveRequestLocale(request, body);
    const { selections, existingEquipment = { cameras: 0, recorderChannels: 0 } } = body;
    
    if (!selections || selections.length === 0) {
      return NextResponse.json({ success: false, message: getApiMessage(locale, "build_no_products") }, { status: 400 });
    }

    // Fetch all products from DB for safety
    const productIds = selections.map(s => s.product_id);
    // Firestore 'in' query supports up to 10 items. Assuming < 10 for MVP cart.
    const snapshot = await adminDb.collection("products").where("__name__", "in", productIds).get();
    
    const dbProducts = new Map<string, Product>();
    snapshot.docs.forEach(doc => {
      dbProducts.set(doc.id, { ...doc.data(), id: doc.id } as Product);
    });

    let cameraCount = 0;
    let wiredCameraCount = 0;
    let wirelessCameraCount = 0;
    let recorderChannels = 0;
    
    const resolvedItems: any[] = [];
    
    for (const sel of selections) {
      const p = dbProducts.get(sel.product_id);
      if (p) {
        resolvedItems.push({ ...p, qty: sel.quantity });
        if (p.category === "cctv_camera" || (p.category as any) === "camera") {
          cameraCount += sel.quantity;
          const pTechs = Array.isArray(p.technologies) ? p.technologies.map(t => String(t).toLowerCase()) : [];
          const pid = (p.id || "").toLowerCase();
          const name = (p.display_name || p.technical_name || "").toLowerCase();
          const isWireless = pTechs.includes("wireless") || pTechs.includes("wifi") || pTechs.includes("4g") ||
                             p.technology === "Wireless" || (p as any).type === "wireless" ||
                             pid.includes("wifi") || pid.includes("wireless") || pid.includes("4g") ||
                             name.includes("wi-fi") || name.includes("wifi") || name.includes("4g") ||
                             Boolean(p.has_wifi) || Boolean(p.has_4g_sim);
          if (isWireless) {
            wirelessCameraCount += sel.quantity;
          } else {
            wiredCameraCount += sel.quantity;
          }
        }
        if (p.category === "recorder" && p.channels) recorderChannels += (p.channels * sel.quantity);
      }
    }

    const totalCameras = cameraCount + (existingEquipment.cameras || 0);
    const totalWiredCameras = wiredCameraCount + (existingEquipment.cameras || 0);
    const totalRecorderChannels = recorderChannels + (existingEquipment.recorderChannels || 0);

    console.log(`[DEBUG] totalCameras=${totalCameras}, totalWiredCameras=${totalWiredCameras}, wirelessCameraCount=${wirelessCameraCount}, totalRecorderChannels=${totalRecorderChannels}, selections=${JSON.stringify(selections)}`);

    const warnings: string[] = [];
    
    // Validation: Only require a recorder if there are wired cameras!
    if (totalWiredCameras > 0 && totalRecorderChannels === 0) {
      const msg = getApiMessage(locale, "build_no_recorder");
      await adminDb.collection("analytics_rejections").add({
        type: "build_rejection",
        reason: "NO_RECORDER",
        message: "Compatibility Error: You have wired cameras but no recorder selected.",
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        message: msg,
      }, { status: 400 });
    } else if (totalWiredCameras > totalRecorderChannels) {
      const msg = getApiMessage(locale, "build_recorder_capacity", {
        channels: totalRecorderChannels,
        cameras: totalWiredCameras,
      });
      await adminDb.collection("analytics_rejections").add({
        type: "build_rejection",
        reason: "RECORDER_CAPACITY_EXCEEDED",
        message: `Compatibility Error: Your recorder(s) only support ${totalRecorderChannels} wired cameras, but you will have ${totalWiredCameras} wired cameras.`,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        message: msg,
      }, { status: 400 });
    }

    // Storage Validation
    const storageSelected = resolvedItems.filter(i => i.category === "storage");
    let totalStorageTb = 0;
    let totalSdCards = 0;
    for (const item of storageSelected) {
      const isSd = item.storage_type === "Micro SD" || (item.display_name || "").toLowerCase().includes("sd") || (item.id || "").toLowerCase().includes("sd");
      if (isSd) {
        totalSdCards += item.qty;
      } else if (item.storage_capacity_tb) {
        totalStorageTb += (item.storage_capacity_tb * item.qty);
      }
    }
    
    if (totalWiredCameras > 0 && totalStorageTb === 0) {
      warnings.push(getApiMessage(locale, "build_no_hdd_warning"));
    } else if (totalStorageTb > 0 && totalWiredCameras > 0) {
      const estimatedDays = Math.floor((totalStorageTb * 30) / totalWiredCameras);
      warnings.push(
        getApiMessage(locale, "build_hdd_days_note", {
          tb: totalStorageTb,
          days: estimatedDays,
          cameras: totalWiredCameras,
        })
      );
    }

    if (wirelessCameraCount > 0 && totalSdCards === 0) {
      warnings.push(getApiMessage(locale, "build_no_sd_warning"));
    } else if (wirelessCameraCount > 0 && totalSdCards < wirelessCameraCount) {
      warnings.push(
        getApiMessage(locale, "build_sd_count_note", {
          sd: totalSdCards,
          cameras: wirelessCameraCount,
        })
      );
    }

    // Auto-complete (mocking basic connector addition for wired cameras only)
    const hasConnectors = resolvedItems.some(i => i.category === "connector");
    if (!hasConnectors && totalWiredCameras > 0) {
      // Add a dummy connector item for pricing, in real life fetch actual SKUs
      resolvedItems.push({
        id: "mock-bnc",
        technical_name: "BNC/DC Connector Pair",
        display_name: "BNC/DC Connector Pair",
        category: "connector",
        unit_price: 50,
        qty: totalWiredCameras
      });
    }

    // Construct a single plan any to run through pricing-engine-v2
    const singlePlanSystem: any = {
      plan_type: "recommended",
      cameras: resolvedItems.filter(i => i.category === "cctv_camera").map(i => ({ product: i, qty: i.qty })),
      recorder: resolvedItems.find(i => i.category === "recorder"),
      storage: resolvedItems.find(i => i.category === "storage"),
      power: resolvedItems.find(i => i.category === "power_supply"),
      cable_meters: 0,
      connectors_qty: 0,
    };

    // Dummy requirement for pricing engine
    const mockReq: any = {
      camera_count: cameraCount,
      recording_days: 15,
      wants_remote_viewing: true
    };
    
    // Dummy settings
    const mockSettings: any = {
      gst_rate: 18,
      labor_fitting_only_rate: 500,
      labor_full_installation_rate: 1000,
      wire_cost_per_meter: 20
    };

    const pricing = generatePricingSnapshot(
      singlePlanSystem as any,
      mockReq as any,
      [],
      [],
      mockSettings as any
    );

    return NextResponse.json({ 
      success: true, 
      pricing: pricing,
      warnings,
      configuration: resolvedItems 
    });
  } catch (error: any) {
    console.error("Builder calculate error:", error);
    return NextResponse.json({ success: false, message: getApiMessage(locale, "internal_error") }, { status: 500 });
  }
}



