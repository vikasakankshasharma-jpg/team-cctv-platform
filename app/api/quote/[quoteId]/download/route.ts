import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { QuotePDFDocument } from "@/lib/pdf/quote-pdf";
import { getCachedAdminSettings } from "@/lib/cached-settings";
import { getOrCreateLeadQuote } from "@/lib/baseline-quote";
import React from "react";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    
    const baseline = await getOrCreateLeadQuote(quoteId);
    let quoteData: any = baseline.quoteData;
    let leadData: any = baseline.leadData || {};

    if (!quoteData) {
      return new NextResponse("Quote not found", { status: 404 });
    }

    const quote = {
      id: quoteData.id || quoteId,
      customer_name: quoteData.customer_name || quoteData.billing_details?.customer_name || leadData.customer_name || "Valued Client",
      customer_mobile: quoteData.customer_mobile || quoteData.billing_details?.phone || leadData.mobile_number || "N/A",
      ...quoteData
    };

    const settings = await getCachedAdminSettings();

    // Generate PDF directly in memory
    const pdfStream = await renderToStream(React.createElement(QuotePDFDocument, { quote, settings }) as any);
    
    // Convert Node.js stream to Web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        pdfStream.on('data', (chunk) => controller.enqueue(chunk));
        pdfStream.on('end', () => controller.close());
        pdfStream.on('error', (err) => controller.error(err));
      }
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Quote-${quote.id}.pdf"`,
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
