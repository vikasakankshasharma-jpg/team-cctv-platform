import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const [prodSnap, addonSnap] = await Promise.all([
      adminDb.collection("products")
             .where("is_active", "==", true)
             .get(),
      adminDb.collection("addons")
             .where("is_active", "==", true)
             .get()
    ]);

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

    return NextResponse.json({ success: true, products: items });
  } catch (error) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch catalog" }, { status: 500 });
  }
}
