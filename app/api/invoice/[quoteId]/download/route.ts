import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePDFDocument } from "@/lib/pdf/invoice-pdf";
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
      // 1. Try finding in invoices collection
      const invDoc = await adminDb.collection("invoices").doc(quoteId).get();
      if (invDoc.exists) {
        doc = invDoc as any;
      } else {
        const invSnap = await adminDb.collection("invoices").where("quote_id", "==", quoteId).limit(1).get();
        if (!invSnap.empty) {
          doc = invSnap.docs[0] as any;
        }
      }
    }

    if (!doc.exists) {
      // 2. Try finding in collectionGroup quotes
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
      return new NextResponse("Invoice / Quote record not found", { status: 404 });
    }

    let leadData: any = {};
    if (doc.exists && doc.ref?.parent?.parent) {
      try {
        const leadSnap = await doc.ref.parent.parent.get();
        leadData = leadSnap?.data() || {};
      } catch (e) {
        console.warn("Parent lead fetch error", e);
      }
    } else if (doc.exists) {
      const qd = doc.data() as any;
      const lId = qd?.lead_id || qd?.leadId;
      if (lId) {
        const lSnap = await adminDb.collection("leads").doc(lId).get();
        if (lSnap.exists) {
          leadData = lSnap.data() || {};
        }
      }
    }

    const quoteData = doc.exists ? (doc.data() as any) : {};
    const billingDetails = quoteData.billing_details || leadData?.billing_details;

    const quote = {
      id: quoteId,
      customer_name: billingDetails?.customer_name || quoteData.customer_name || quoteData.customerName || leadData.customer_name || leadData.name || "Customer",
      customer_mobile: billingDetails?.phone || quoteData.customer_mobile || quoteData.customerMobile || leadData.mobile_number || leadData.phone || "N/A",
      company_name: billingDetails?.company_name || quoteData.company_name || leadData.company_name || "",
      gstin: billingDetails?.gstin || quoteData.gstin || quoteData.gst_number || leadData.gst_number || "",
      billing_details: billingDetails,
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
        'Content-Disposition': `attachment; filename="Invoice-${quoteId}.pdf"`,
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    console.error("Invoice PDF generation error:", error);
    return new NextResponse(`Error generating invoice: ${error.message}`, { status: 500 });
  }
}
