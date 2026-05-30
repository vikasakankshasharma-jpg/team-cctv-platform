/**
 * TEAM CCTV — PDF Download API Route
 * File: app/api/v1/quotes/[id]/pdf/route.ts
 *
 * GET /api/v1/quotes/[id]/pdf
 *
 * Flow:
 *  1. Verify the caller owns this quote (Firebase ID token from Authorization header)
 *  2. Check Firebase Storage — return cached PDF if it exists
 *  3. If not cached: generate PDF, upload to Storage, return the file
 *
 * Why NOT in a Cloud Function:
 *  - Vercel Pro allows 60s max duration, set in vercel.json
 *  - PDF generation for a typical 6-item quote takes 1.5–3s
 *  - Caching in Storage means subsequent calls are instant (just a redirect)
 *
 * If you need to scale beyond ~50 concurrent PDF requests, move generation
 * to a Firebase Cloud Function Gen 2 with minInstances: 1.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb as adminFirestore, adminStorage } from "@/lib/firebase-admin";
import { generateQuotePdfBuffer } from "@/components/quote/QuotePDF";

export const maxDuration = 60; // Vercel Pro — keep in sync with vercel.json

interface RouteParams {
  params: Promise<{ leadId: string; quoteId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { leadId, quoteId } = await params;

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let callerUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // ── 2. Fetch quote from Firestore ──────────────────────────────────────────
  const db        = adminFirestore;
  const quoteSnap = await db.collection("leads").doc(leadId).collection("quotes").doc(quoteId).get();

  if (!quoteSnap.exists) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const quote = quoteSnap.data() as Record<string, unknown>;

  // Ownership check — caller must be the customer, a staff member, or a superadmin.
  // Adjust this logic to match your RBAC model.
  const isOwner = quote.firebase_uid === callerUid;
  const isStaff = (quote.assigned_to === callerUid) || (quote.created_by === callerUid);

  // Check custom claims for admin / staff roles
  const caller     = await adminAuth.getUser(callerUid);
  const claims     = caller.customClaims ?? {};
  const isAdmin    = claims.role === "admin" || claims.role === "superadmin";
  const isEmployee = claims.role === "staff" || claims.role === "manager";

  if (!isOwner && !isStaff && !isAdmin && !isEmployee) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if it's an invoice
  const isInvoice = quote.status === "accepted";

  // ── 3. Check Storage cache ─────────────────────────────────────────────────
  const bucket     = adminStorage.bucket();
  const storagePath = `quotes/${leadId}/${quoteId}${isInvoice ? "_invoice" : ""}.pdf`;
  const file        = bucket.file(storagePath);

  try {
    const [exists] = await file.exists();
    if (exists) {
      // Return a short-lived signed URL (1 hour) — client downloads directly from Storage
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 3_600_000, // 1 hour
      });
      return NextResponse.redirect(signedUrl, { status: 302 });
    }
  } catch {
    // Storage check failed — fall through to generate
  }

  // ── 4. Generate PDF ────────────────────────────────────────────────────────
  // Build a typed QuoteData object from the Firestore snapshot.
  // This mapping assumes your Firestore schema — adjust field names as needed.
  const quoteData = {
    id: quoteId,
    quoteNumber:         String(quote.quote_number    ?? quoteId.slice(0, 8).toUpperCase()),
    status:              String(quote.status          ?? "pending"),
    issuedAt:            String((quote.created_at as any)?.toDate?.()?.toISOString() ?? new Date().toISOString()),
    validUntil:          String(quote.valid_until     ?? ""),
    customer: {
      name:  String(quote.customer_name  ?? "Customer"),
      phone: String(quote.customer_phone ?? ""),
      email: quote.customer_email ? String(quote.customer_email) : undefined,
    },
    installationAddress: String(quote.installation_address ?? ""),
    propertyType:        String(quote.property_type        ?? ""),
    propertyDetail:      String(quote.property_detail      ?? ""),
    siteVisitDate:       quote.site_visit_date ? String(quote.site_visit_date) : undefined,
    lineItems:           Array.isArray(quote.line_items) ? quote.line_items : [],
    gstPercent:          Number(quote.gst_percent   ?? 18),
    advancePercent:      Number(quote.advance_percent ?? 30),
    companyGstin:        String(quote.company_gstin ?? ""),
    notes:               quote.notes ? String(quote.notes) : undefined,
  };

  // Fetch settings for custom PDF logo and terms
  const settingsSnap = await adminFirestore.collection("settings").doc("app_settings").get();
  const settings = settingsSnap.exists ? settingsSnap.data() : undefined;

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateQuotePdfBuffer(quoteData as Parameters<typeof generateQuotePdfBuffer>[0], settings, isInvoice);
  } catch (err) {
    console.error("[QuotePDF] Generation failed:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }

  // ── 5. Upload to Storage ───────────────────────────────────────────────────
  try {
    await file.save(pdfBuffer, {
      metadata: {
        contentType:        "application/pdf",
        cacheControl:       "private, max-age=3600",
        contentDisposition: `attachment; filename="TEAM-CCTV-Quote-${quoteData.quoteNumber}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[QuotePDF] Storage upload failed:", err);
    // Don't fail the request — return the buffer directly as fallback
    return new Response(pdfBuffer as any, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="TEAM-CCTV-Quote-${quoteData.quoteNumber}.pdf"`,
      },
    });
  }

  // Return the newly uploaded PDF via signed URL
  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 3_600_000,
  });

  return NextResponse.redirect(signedUrl, { status: 302 });
}
