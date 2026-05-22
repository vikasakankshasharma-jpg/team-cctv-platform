import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { Product } from "@/types";

export async function GET() {
  try {
    const productsSnap = await adminDb
      .collection("products")
      .where("is_active", "==", true)
      .where("is_deleted", "==", false)
      .get();

    const products = productsSnap.docs.map((doc) => {
      const data = doc.data() as Product;
      // STRIP SENSITIVE FIELDS: Never expose internal costs/margins to the browser
      const { base_cost, margin_percentage, ...publicData } = data;
      return { id: doc.id, ...publicData } as Product;
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching public products:", error);
    return NextResponse.json({ products: [], error: "Failed to load products" }, { status: 500 });
  }
}
