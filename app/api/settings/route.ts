import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, SETTINGS_DOC_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const docSnap = await adminDb
      .collection(COLLECTIONS.SETTINGS)
      .doc(SETTINGS_DOC_ID)
      .get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    const data = docSnap.data();
    
    // Serialize timestamps
    const settings = {
      ...data,
      created_at: data?.created_at?.toDate?.()?.toISOString() || null,
      updated_at: data?.updated_at?.toDate?.()?.toISOString() || null,
    };

    return NextResponse.json(settings);
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching settings:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
