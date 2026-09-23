import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { id, action } = await req.json(); // action = "approve" | "reject"

    if (!id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = adminDb.collection("offline_verifications").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const data = docSnap.data() as any;

    if (action === "approve") {
      await adminDb.runTransaction(async (transaction) => {
        transaction.update(docRef, {
          status: "approved",
          approved_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        
        // Also update the quote if quote_id exists
        if (data.quote_id) {
          const quoteRef = adminDb.collection("quotes").doc(data.quote_id);
          const qSnap = await transaction.get(quoteRef);
          if (qSnap.exists) {
            transaction.update(quoteRef, {
              status: "PAID",
              payment_status: "captured",
              payment_method: "offline",
              paid_at: new Date().toISOString(),
              updated_at: serverTimestamp(),
            });
          }
        }
      });
    } else {
      await docRef.update({
        status: "rejected",
        rejected_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Approve offline error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
