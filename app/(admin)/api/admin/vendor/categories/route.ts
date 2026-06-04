import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const db = adminDb;
    const snapshot = await db.collection("vendor_categories").orderBy("level").get();
    
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error("Error fetching vendor categories:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
