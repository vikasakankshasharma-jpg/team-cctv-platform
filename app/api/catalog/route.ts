import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const [prodSnap, addonSnap, settingsSnap] = await Promise.all([
      adminDb.collection("products")
             .where("is_active", "==", true)
             .get(),
      adminDb.collection("addons")
             .where("is_active", "==", true)
             .get(),
      adminDb.collection("settings").doc("app_config").get()
    ]);
    
    const settings = settingsSnap.exists ? settingsSnap.data() : {};

    const items: any[] = [];
    
    prodSnap.forEach(doc => {
      const data = doc.data() as any;
      if (data.is_deleted === true) return; // Skip deleted products
      if (!Array.isArray(data.technologies)) {
        data.technologies = data.technology ? [data.technology] : ["Common"];
      }
      items.push({ id: doc.id, ...data, type: "product" });
    });

    addonSnap.forEach(doc => {
      const data = doc.data();
      if (data.is_deleted === true) return; // Skip deleted addons
      items.push({ 
        id: doc.id, 
        ...data,
        unit_price: data.price || data.unit_price || 0,
        category: data.category || "accessory",
        technologies: data.technology ? [data.technology] : ["Common"],
        type: "addon"
      });
    });

    // Dynamically generate Installation "Products" based on Admin Settings
    // This perfectly respects Admin Rules without hardcoding dummy prices
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
