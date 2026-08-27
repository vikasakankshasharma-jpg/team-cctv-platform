import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Product } from "@/types";
import { calculatePricingV2 } from "@/lib/pricing-engine-v2";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { selections: any[], existingEquipment?: { cameras: number, recorderChannels: number } };
    const { selections, existingEquipment = { cameras: 0, recorderChannels: 0 } } = body;
    
    if (!selections || selections.length === 0) {
      return NextResponse.json({ success: false, message: "No products selected" }, { status: 400 });
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
    let recorderChannels = 0;
    
    const resolvedItems: any[] = [];
    
    for (const sel of selections) {
      const p = dbProducts.get(sel.product_id);
      if (p) {
        resolvedItems.push({ ...p, qty: sel.quantity });
        if (p.category === "cctv_camera") cameraCount += sel.quantity;
        if (p.category === "recorder" && p.channels) recorderChannels += (p.channels * sel.quantity);
      }
    }

    const totalCameras = cameraCount + (existingEquipment.cameras || 0);
    const totalRecorderChannels = recorderChannels + (existingEquipment.recorderChannels || 0);

    console.log(`[DEBUG] totalCameras=${totalCameras}, totalRecorderChannels=${totalRecorderChannels}, selections=${JSON.stringify(selections)}`);

    const warnings: string[] = [];
    
    // Validation
    if (totalCameras > 0 && totalRecorderChannels === 0) {
      const msg = "Compatibility Error: You have cameras but no recorder selected.";
      await adminDb.collection("analytics_rejections").add({
        type: "build_rejection",
        reason: "NO_RECORDER",
        message: msg,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        message: msg,
      }, { status: 400 });
    } else if (totalCameras > totalRecorderChannels) {
      const msg = `Compatibility Error: Your recorder(s) only support ${totalRecorderChannels} cameras, but you will have ${totalCameras} cameras. Please upgrade your recorder.`;
      await adminDb.collection("analytics_rejections").add({
        type: "build_rejection",
        reason: "RECORDER_CAPACITY_EXCEEDED",
        message: msg,
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
    for (const hdd of storageSelected) {
      if (hdd.storage_capacity_tb) totalStorageTb += (hdd.storage_capacity_tb * hdd.qty);
    }
    
    if (totalStorageTb === 0 && cameraCount > 0) {
      warnings.push("You haven't selected any storage (HDD). Your system will not record video.");
    } else if (totalStorageTb > 0 && cameraCount > 0) {
      // Rough estimate: 1TB = 30 days for 1 camera (H.265)
      const estimatedDays = Math.floor((totalStorageTb * 30) / cameraCount);
      warnings.push(`Note: Your selected ${totalStorageTb}TB storage will provide approximately ${estimatedDays} days of recording for ${cameraCount} cameras.`);
    }

    // Auto-complete (mocking basic connector addition)
    const hasConnectors = resolvedItems.some(i => i.category === "connector");
    if (!hasConnectors && cameraCount > 0) {
      // Add a dummy connector item for pricing, in real life fetch actual SKUs
      resolvedItems.push({
        id: "mock-bnc",
        technical_name: "BNC/DC Connector Pair",
        display_name: "BNC/DC Connector Pair",
        category: "connector",
        unit_price: 50,
        qty: cameraCount
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

    const pricing = calculatePricingV2({
      resolvedSystem: singlePlanSystem as any,
      req: mockReq as any,
      settings: mockSettings,
      addons: []
    });

    return NextResponse.json({ 
      success: true, 
      pricing: pricing,
      warnings,
      configuration: resolvedItems 
    });
  } catch (error: any) {
    console.error("Builder calculate error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}



