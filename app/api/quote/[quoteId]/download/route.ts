import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { renderToStream } from "@react-pdf/renderer";
import { QuotePDFDocument } from "@/lib/pdf/quote-pdf";
import React from "react";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    
    let doc = await adminDb.collection("quotes").doc(quoteId).get();
    
    if (!doc.exists) {
      doc = await adminDb.collection("quotes").doc(quoteId.toUpperCase()).get();
    }

    if (!doc.exists) {
      try {
        const quotesSnap = await adminDb.collectionGroup("quotes").get();
        const found = quotesSnap.docs.find((d: any) => d.id === quoteId || d.id === quoteId.toUpperCase());
        if (found) {
          doc = found as any;
        }
      } catch (cgErr) {
        console.warn("CollectionGroup lookup failed:", cgErr);
      }
    }
    
    if (!doc.exists) {
      return new NextResponse("Quote not found", { status: 404 });
    }

    let leadData: any = {};
    if (doc.ref?.parent?.parent) {
      const leadSnap = await doc.ref.parent.parent.get();
      leadData = leadSnap?.data() || {};
    } else {
      const qData = doc.data() as any;
      const lId = qData?.lead_id || qData?.leadId;
      if (lId) {
        const leadSnap = await adminDb.collection("leads").doc(lId).get();
        if (leadSnap.exists) {
          leadData = leadSnap.data() || {};
        }
      }
    }

    const qData = (doc.data() as any) || {};

    const quote = {
      id: quoteId,
      customer_name: qData.customer_name || qData.billing_details?.customer_name || leadData.customer_name || "Valued Client",
      customer_mobile: qData.customer_mobile || qData.billing_details?.phone || leadData.mobile_number || "N/A",
      ...qData
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
        'Content-Disposition': `inline; filename="Quote-${quoteId}.pdf"`,
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
