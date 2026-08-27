import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    
    // Fetch snapshot
    const doc = await adminDb.collection("quotes").doc(quoteId).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Quote not found" }, { status: 404 });
    }
    
    const quote = doc.data() as any;

    // By-passing Firebase Storage due to GCP Billing absence.
    // Instead of uploading, we provide a dynamic stream endpoint.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const dynamicPdfUrl = `${baseUrl}/api/quote/${quoteId}/download`;

    // Update quote status
    if (quote.status === "GENERATED" || quote.status === "DRAFT") {
        await adminDb.collection("quotes").doc(quoteId).update({
            status: "PDF_GENERATED"
        });
    }

    return NextResponse.json({ success: true, url: dynamicPdfUrl });
  } catch (error: any) {
    console.error("PDF resolution error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

