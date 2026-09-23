import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { quoteId, otp } = await req.json();

    if (!quoteId || !otp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const quoteRef = adminDb.collection("quotes").doc(quoteId);
    const quoteSnap = await quoteRef.get();

    if (!quoteSnap.exists) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quoteData = quoteSnap.data();

    if (quoteData?.install_start_otp !== otp) {
      return NextResponse.json({ error: "Invalid Start OTP" }, { status: 400 });
    }

    await quoteRef.update({
      install_status: "STARTED",
      install_started_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Installer Start Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
