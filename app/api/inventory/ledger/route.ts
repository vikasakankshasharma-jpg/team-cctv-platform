import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const snapshot = await adminDb.collection("stock_ledger").orderBy("timestamp", "desc").limit(100).get();
    const ledger = snapshot.docs.map(doc => doc.data());
    return NextResponse.json({ success: true, data: ledger });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
