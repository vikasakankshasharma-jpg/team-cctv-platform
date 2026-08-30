import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";

import { renderToStream } from "@react-pdf/renderer";
import { QuotePDFDocument } from "@/lib/pdf/quote-pdf";
import React from "react";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    
    // Fetch snapshot using collectionGroup since quotes are stored under leads/{leadId}/quotes/{quoteId}
    const quotesSnap = await adminDb.collectionGroup("quotes").get();
    const doc = quotesSnap.docs.find((d: any) => d.id === quoteId);
    
    if (!doc) {
      return new NextResponse("Quote not found", { status: 404 });
    }
    
    const leadSnap = await doc.ref.parent.parent?.get();
    const leadData = leadSnap?.data() || {};

    const quote = {
      id: quoteId,
      customer_name: leadData.customer_name || "Customer",
      customer_mobile: leadData.mobile_number || "N/A",
      ...doc.data()
    };

    // Generate PDF directly in memory
    const pdfStream = await renderToStream(React.createElement(QuotePDFDocument, { quote }) as any);
    
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
        'Content-Disposition': `inline; filename="Quote-${quoteId}.pdf"`
      }
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}

