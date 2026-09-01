import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePDFDocument } from "@/lib/pdf/invoice-pdf";
import React from "react";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    
    let doc = await adminDb.collection("quotes").doc(quoteId).get();
    
    if (!doc.exists) {
      return new NextResponse("Quote not found", { status: 404 });
    }

    const quoteData = doc.data() as any;
    
    // Verify the quote is actually paid
    if (quoteData.status !== "PAID") {
      return new NextResponse("Invoice not available - payment not confirmed", { status: 403 });
    }

    const quote = {
      id: quoteId,
      customer_name: quoteData.customer_name || "Customer",
      customer_mobile: quoteData.customer_mobile || "N/A",
      ...quoteData
    };

    const pdfStream = await renderToStream(React.createElement(InvoicePDFDocument, { quote }) as any);
    
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
        'Content-Disposition': `inline; filename="Invoice-${quoteId}.pdf"`
      }
    });
  } catch (error: any) {
    console.error("Invoice PDF generation error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
