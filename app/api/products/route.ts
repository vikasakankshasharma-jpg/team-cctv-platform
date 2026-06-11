import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { Product } from "@/types";
import { getCatalogCapacity } from "@/lib/catalog-capacity";

export async function GET() {
  try {
    const productsSnap = await adminDb
      .collection("products")
      .where("is_active", "==", true)
      .get();

    const { verifySession } = await import("@/lib/auth-server");
    const session = await verifySession();
    const canSeeWholesale = session.isAuthenticated && (session.role === "sales_staff" || session.role === "super_admin");

    const products = productsSnap.docs.map((doc) => {
      const data = doc.data() as any;
      if (data.is_deleted === true) return null;
      
      if (!Array.isArray(data.technologies)) {
        data.technologies = data.technology ? [data.technology] : ["Common"];
      }
      
      if (!canSeeWholesale) {
        // STRIP SENSITIVE FIELDS: Never expose internal costs to public
        delete data.base_cost;
        delete data.margin_percentage;
      }
      
      return { id: doc.id, ...data } as Product;
    }).filter(Boolean) as Product[];

    // Compute dynamic camera capacity from recorder catalog
    const catalog_capacity = getCatalogCapacity(products);

    return NextResponse.json({ products, catalog_capacity });
  } catch (error) {
    console.error("Error fetching public products:", error);
    return NextResponse.json({ products: [], catalog_capacity: { HD: 16, IP: 16, Wireless: 16 }, error: "Failed to load products" }, { status: 500 });
  }
}

