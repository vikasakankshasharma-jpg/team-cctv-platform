import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Product } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    
    let query: FirebaseFirestore.Query = adminDb.collection("products")
      .where("is_active", "==", true)
      .where("is_configurator_visible", "==", true);
      
    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();
    
    const products = snapshot.docs.map(doc => {
      const data = doc.data() as Product;
      return { ...data, id: doc.id };
    });

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error("Error fetching build products:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
