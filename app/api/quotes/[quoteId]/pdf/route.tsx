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
