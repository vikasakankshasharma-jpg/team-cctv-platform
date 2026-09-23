import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { quoteId, type } = await req.json();

    if (!quoteId || !type) {
      return NextResponse.json({ error: "Missing quoteId or type" }, { status: 400 });
    }

    const quoteRef = adminDb.collection("quotes").doc(quoteId);
    
    if (type === "DELIVERY") {
      await quoteRef.update({
        cash_collection_status: "SETTLED_WITH_ADMIN",
        cash_settled_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    } else if (type === "INSTALLER") {
      await quoteRef.update({
        installer_cash_status: "SETTLED_WITH_ADMIN",
        installer_cash_settled_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Settle cash error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
