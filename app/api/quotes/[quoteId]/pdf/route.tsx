import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";

const SETTINGS_DOC_ID = "app_config";
import { renderToStream } from "@react-pdf/renderer";
import { QuotePDFDocument } from "@/lib/pdf-generator";
import type { Lead, Quote, AppSettings } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const sharedTo = searchParams.get('shared_to') || undefined;
    const { quoteId } = await params;

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID identification required" }, { status: 400 });
    }

    // Mock bypass for E2E visual testing - Serving THE REAL PDF as a stream
    if (leadId === "mock-e2e-lead" || quoteId === "mock-quote-id") {
      const mockLead = { id: "mock-e2e-lead", customer_name: "Tester Alpha", mobile_number: "9999999999", property_type: "home" } as Lead;
      const mockQuote = { 
        id: quoteId, 
        plan_type: "recommended", 
        technology: "IP", 
        items: [
           { product_id: "p1", display_name: "2MP IP Camera (Standard)", qty: 4, unit_price: 2200, line_total: 8800 },
           { product_id: "p4", display_name: "4 Channel IP NVR", qty: 1, unit_price: 5500, line_total: 5500 },
           { product_id: "s1", display_name: "1TB Surveillance HDD", qty: 1, unit_price: 4500, line_total: 4500 }
        ], 
        addons: [
           { addon_id: "a1", display_name: "PVC Junction Box", qty: 4, price: 1800 }
        ],
        base_hardware_cost: 18800,
        labor_cost: 6000,
        cabling_cost: 3600,
        addons_total: 1800,
        referral_discount: 500,
        gst_rate: 18,
        gst_amount: 5436,
        total_payable: 35636
      } as unknown as Quote; 
      const mockSettings = { company_name: "TEAM CCTV" } as AppSettings;

      // Note: In mock mode, we don't have the full quote object from DB, 
      // so we use placeholder data for the structure but the STYLING will be the real new template.
      // Ideally, the client should POST the quote data for the preview.
      
      const pdfStream = await renderToStream(
        <QuotePDFDocument quote={mockQuote} lead={mockLead} settings={mockSettings} quoteId={quoteId} sharedToNumber={sharedTo} />
      );

      return new Response(pdfStream as unknown as ReadableStream, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="TEAM_CCTV_Quote_${quoteId}.pdf"`,
        },
      });
    }

    if (!adminDb || !adminStorage) {
       return NextResponse.json({ error: "Storage not initialized" }, { status: 500 });
    }

    // 1. Fetch data
    const leadDoc = await adminDb.collection("leads").doc(leadId).get();
    const quoteDoc = await adminDb.collection("leads").doc(leadId).collection("quotes").doc(quoteId).get();
    const settingsDoc = await adminDb.collection("settings").doc(SETTINGS_DOC_ID).get();

    if (!leadDoc.exists || !quoteDoc.exists) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const lead = { id: leadDoc.id, ...leadDoc.data() } as Lead;
    const quote = { id: quoteDoc.id, ...quoteDoc.data() } as Quote;
    const settings = (settingsDoc.data() || { company_name: "TEAM CCTV" }) as AppSettings;

    // 2. Render PDF to memory
    const pdfStream = await renderToStream(
      <QuotePDFDocument quote={quote} lead={lead} settings={settings} quoteId={quoteId} sharedToNumber={sharedTo} />
    );

    // Convert NodeJS Readable stream to ArrayBuffer for Storage upload
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk as Buffer));
    }
    const pdfBuffer = Buffer.concat(chunks);

    // 3. Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const filePath = `quotes/${lead.firebase_uid}/${quoteId}.pdf`;
    const file = bucket.file(filePath);

    await file.save(pdfBuffer, {
      contentType: "application/pdf",
      resumable: false,
    });

    // Generate a long-lived absolute URL directly from the bucket (or use signed URLs in strict security context)
    // For this app, signed URLs are better.
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days valid link
    });

    // 4. Save URL back to quote doc
    await quoteDoc.ref.update({
      pdf_url: signedUrl,
    });

    // Return the URL so the client can open/download it
    return NextResponse.json({ url: signedUrl }, { status: 200 });

  } catch (error) {
    console.error("PDF Generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
