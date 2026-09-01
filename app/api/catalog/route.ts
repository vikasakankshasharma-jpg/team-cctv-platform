import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const [prodSnap, addonSnap] = await Promise.all([
      adminDb.collection("products")
             .where("is_active", "==", true)
             .where("is_deleted", "==", false)
             .get(),
      adminDb.collection("addons")
             .where("is_active", "==", true)
             .where("is_deleted", "==", false)
             .get()
    ]);

    const items: any[] = [];
    
    prodSnap.forEach(doc => {
      const data = doc.data() as any;
      if (!Array.isArray(data.technologies)) {
        data.technologies = data.technology ? [data.technology] : ["Common"];
      }
      items.push({ id: doc.id, ...data, type: "product" });
    });

    addonSnap.forEach(doc => {
      const data = doc.data();
      items.push({ 
        id: doc.id, 
        ...data,
        unit_price: data.price || data.unit_price || 0,
        category: data.category || "accessory",
        technologies: data.technology ? [data.technology] : ["Common"],
        type: "addon"
      });
    });

    // Add installation pseudo-products
    items.push({
      id: "PRO_INSTALL_HD",
      display_name: "Standard Installation (HD)",
      category: "installation",
      technologies: ["HD"],
      unit_price: 600,
      unit_multiplier: "camera_count",
      type: "service"
    });
    
    items.push({
      id: "PRO_INSTALL_IP",
      display_name: "Standard Installation (IP)",
      category: "installation",
      technologies: ["IP"],
      unit_price: 800,
      unit_multiplier: "camera_count",
      type: "service"
    });

    return NextResponse.json({ success: true, products: items });
  } catch (error) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch catalog" }, { status: 500 });
  }
}
