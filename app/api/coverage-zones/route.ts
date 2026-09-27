import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET all zones for maps
export async function GET() {
  try {
    const snap = await adminDb.collection("coverage_zones").orderBy("name").get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch zones" }, { status: 500 });
  }
}
