import { NextResponse } from "next/server";
import { getOrCreateLeadQuote } from "@/lib/baseline-quote";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    
    const baseline = await getOrCreateLeadQuote(quoteId);
    if (!baseline.quoteData && !baseline.leadData) {
      return NextResponse.json({ success: false, message: "Quote not found" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";
    const dynamicPdfUrl = `${baseUrl}/api/quote/${quoteId}/download`;

    return NextResponse.json({ success: true, url: dynamicPdfUrl });
  } catch (error: any) {
    console.error("PDF resolution error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
