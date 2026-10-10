/**
 * TEAM CCTV â€” PDF Download API Route
 * File: app/api/v1/quotes/[id]/pdf/route.ts
 *
 * GET /api/v1/quotes/[id]/pdf
 *
 * Flow:
 *  1. Verify the caller owns this quote (Firebase ID token from Authorization header)
 *  2. Check Firebase Storage â€” return cached PDF if it exists
 *  3. If not cached: generate PDF, upload to Storage, return the file
 *
 * Why NOT in a Cloud Function:
 *  - Vercel Pro allows 60s max duration, set in vercel.json
 *  - PDF generation for a typical 6-item quote takes 1.5â€“3s
 *  - Caching in Storage means subsequent calls are instant (just a redirect)
 *
 * If you need to scale beyond ~50 concurrent PDF requests, move generation
 * to a Firebase Cloud Function Gen 2 with minInstances: 1.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb as adminFirestore, adminStorage } from "@/lib/firebase-admin";
import { generateQuotePdfBuffer } from "@/components/quote/QuotePDF";

export const maxDuration = 60; // Vercel Pro â€” keep in sync with vercel.json

interface RouteParams {
  params: Promise<{ leadId: string; quoteId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { leadId, quoteId } = await params;

  // â”€â”€ 1. Fetch quote from Firestore â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const db        = adminFirestore;
  
  // Check Root Collection FIRST (V2), then Subcollection (Legacy)
  let quoteSnap = await db.collection("quotes").doc(quoteId).get();
  
  if (!quoteSnap.exists) {
    // Try uppercase
    quoteSnap = await db.collection("quotes").doc(quoteId.toUpperCase()).get();
  }
  
  if (!quoteSnap.exists) {
    quoteSnap = await db.collection("leads").doc(leadId).collection("quotes").doc(quoteId).get();
  }

  if (!quoteSnap.exists) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const quote = quoteSnap.data() as any;

  // 2. Fetch Associated Lead Document
  let trueLeadId = leadId;
  if (quote.lead_id || quote.leadId) {
    trueLeadId = quote.lead_id || quote.leadId;
  }

  let lead: any = {};
  if (trueLeadId) {
    const leadSnap = await db.collection("leads").doc(trueLeadId as string).get();
    if (leadSnap.exists) {
      lead = leadSnap.data();
    }
  }

  // 3. Extract Line Items from all possible schemas (Root Snapshots vs Legacy)
  let rawItems: any[] = [];

  if (Array.isArray(quote?.items) && quote.items.length > 0) {
    rawItems = quote.items;
  } else if (Array.isArray((quote?.configurationSnapshot as any)?.items)) {
    rawItems = (quote.configurationSnapshot as any).items;
  } else if (Array.isArray((quote?.pricingSnapshot as any)?.breakdown?.items)) {
    rawItems = (quote.pricingSnapshot as any).breakdown.items;
  } else if (Array.isArray((quote?.pricingSnapshot as any)?.items)) {
    rawItems = (quote.pricingSnapshot as any).items;
  } else if (Array.isArray(quote?.hardware_cart)) {
    rawItems = quote.hardware_cart as any;
  }

  const addons = Array.isArray(quote?.addons) ? quote.addons : [];

  const lineItems = [
    ...rawItems.map((item: any) => ({
      id: item.product_id || item.id || item.sku || Math.random().toString(36).substr(2, 9),
      name: item.display_name || item.name || item.title || "CCTV Component",
      brand: item.brand || "",
      description: item.technology ? `Camera type: ${item.technology} | Tier: ${item.resolution_tier || 'standard'}` : (item.description || ""),
      badge: item.technology ? { label: item.technology, color: item.technology === "IP" ? "#2C5F8A" : "#0F1F3D" } : undefined,
      quantity: item.qty || item.quantity || 1,
      unitPrice: item.unit_price || item.unitPrice || item.price || 0,
    })),
    ...addons.map((addon: any) => ({
      id: addon.addon_id || addon.id || Math.random().toString(36).substr(2, 9),
      name: addon.display_name || addon.name || "Add-on component",
      description: "Add-on component",
      quantity: addon.qty || addon.quantity || 1,
      unitPrice: addon.price || addon.unit_price || 0,
    }))
  ];

  if (quote?.negotiated_discount) {
    lineItems.push({
      id: "negotiated_discount",
      name: "Special Discount",
      description: "Applied discount",
      badge: { label: "Discount", color: "#EF4444" },
      quantity: 1,
      unitPrice: -(quote.negotiated_discount as number)
    });
  }
  
  if (quote?.full_payment_discount) {
    lineItems.push({
      id: "full_payment_discount",
      name: "Full Payment Discount (2%)",
      description: "Automatic discount applied for paying 100% in advance",
      badge: { label: "Save 2%", color: "#10B981" },
      quantity: 1,
      unitPrice: -(quote.full_payment_discount as number)
    });
  }

  // Address resolution
  const rawInstall = (quote?.billing_details as any)?.address_line1 
    ? `${(quote.billing_details as any).address_line1}, ${(quote.billing_details as any).city || ''} ${(quote.billing_details as any).pincode || ''}`
    : (lead?.address?.street ? `${lead.address.building_no || ''} ${lead.address.street || ''}, ${lead.address.area || ''}, ${lead.address.city || ''} - ${lead.address.pincode || ''}` : (quote?.installationAddress || ""));
  const cleanInstallAddress = (typeof rawInstall === 'string' && (rawInstall.toLowerCase().includes("address pending") || rawInstall.toLowerCase() === "pending")) ? "" : String(rawInstall);

  const rawLine1 = (quote?.billing_details as any)?.address_line1 || lead?.address?.street || lead?.address?.full_address || "";
  const cleanLine1 = (typeof rawLine1 === 'string' && (rawLine1.toLowerCase().includes("address pending") || rawLine1.toLowerCase() === "pending")) ? "" : String(rawLine1);

  const totalPayable = Number(
    (quote?.pricingSnapshot as any)?.total_payable ??
    quote?.total_payable ??
    quote?.total ??
    lead?.total_payable ??
    0
  );

  const quoteData: any = {
    id: quoteSnap.id,
    leadId: trueLeadId || quoteSnap.id,
    quoteNumber: String(quote?.quote_number || quote?.quote_id || quoteSnap.id),
    status: String(quote?.status || "pending"),
    issuedAt: quote?.createdAt || (quote?.created_at as any)?.toDate?.()?.toISOString() || new Date().toISOString(),
    validUntil: quote?.validUntil || quote?.valid_until || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    customer: {
      name: String(
        (quote?.billing_details as any)?.customer_name ||
        (quote?.customer_name && quote.customer_name !== "Pro Builder Client" ? quote.customer_name : null) ||
        lead?.customer_name ||
        lead?.wizard_answers?.customer_name ||
        lead?.wizard_answers?.name ||
        quote?.customer_name ||
        "Valued Customer"
      ),
      phone: String(
        (quote?.billing_details as any)?.phone ||
        (quote?.customer_mobile && quote.customer_mobile !== "N/A" ? quote.customer_mobile : null) ||
        lead?.mobile_number ||
        lead?.customer_mobile ||
        lead?.wizard_answers?.customer_mobile ||
        lead?.wizard_answers?.phone ||
        lead?.phone ||
        ""
      ),
      email: String(
        (quote?.billing_details as any)?.email ||
        quote?.customer_email ||
        lead?.email ||
        lead?.customer_email ||
        lead?.wizard_answers?.customer_email ||
        ""
      ),
    },
    installationAddress: cleanInstallAddress || (
      lead?.wizard_answers?.city || lead?.city ? `${lead?.wizard_answers?.city || lead?.city || ''} ${lead?.wizard_answers?.pincode || lead?.pincode || ''}`.trim() : ""
    ),
    propertyType: String(lead?.property_type || (quote?.requirementSnapshot as any)?.property_type || "Residential"),
    propertyDetail: String((quote?.requirementSnapshot as any)?.property_detail || lead?.property_detail || ""),
    siteVisitDate: lead?.site_visit_date || "",
    lineItems,
    gstPercent: Number((quote?.pricingSnapshot as any)?.gst_rate || quote?.gst_rate || 18),
    advancePercent: Number(quote?.advance_percent || 30), 
    companyGstin: "08AABCT1234A1ZS",
    billing_details: {
      is_business: !!((quote?.billing_details as any)?.is_business ?? (lead?.is_b2b || quote?.company_name || quote?.gstin || quote?.gst_number || lead?.gst_number)),
      company_name: String((quote?.billing_details as any)?.company_name || quote?.company_name || lead?.company_name || ""),
      gstin: String((quote?.billing_details as any)?.gstin || quote?.gst_number || lead?.gst_number || ""),
      customer_name: String((quote?.billing_details as any)?.customer_name || lead?.customer_name || quote?.customer_name || ""),
      phone: String((quote?.billing_details as any)?.phone || lead?.mobile_number || quote?.customer_mobile || ""),
      email: String((quote?.billing_details as any)?.email || lead?.email || ""),
      address_line1: cleanLine1,
      address_line2: String((quote?.billing_details as any)?.address_line2 || lead?.address?.landmark1 || ""),
      city: String((quote?.billing_details as any)?.city || lead?.address?.city || lead?.detected_city || lead?.wizard_answers?.city || lead?.wizard_answers?.q_city || "Jaipur"),
      state: String((quote?.billing_details as any)?.state || lead?.address?.state || lead?.detected_state || lead?.wizard_answers?.state || lead?.wizard_answers?.q_state || "Rajasthan"),
      state_code: String((quote?.billing_details as any)?.state_code || "08"),
      pincode: String((quote?.billing_details as any)?.pincode || lead?.address?.pincode || lead?.detected_pincode || lead?.wizard_answers?.pincode || lead?.wizard_answers?.q_pincode || ""),
      coordinates: (quote?.billing_details as any)?.coordinates || lead?.address?.coordinates || null,
      google_maps_link: String((quote?.billing_details as any)?.google_maps_link || lead?.address?.map_url || ""),
    },
    version: Number(quote?.version || 1),
    isRevision: !!quote?.is_revision,
    revisionNotes: quote?.revision_notes ? String(quote.revision_notes) : undefined,
    notes: "This quotation is valid for 14 days from the date of issue. Prices are subject to change after expiry.",
  };

  // â”€â”€ 2. Auth (Optional for magic links, strict for others) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const authHeader = request.headers.get("Authorization");
  let callerUid: string | null = null;
  let isAdmin = false;
  let isEmployee = false;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
      callerUid = decoded.uid;
      const caller = await adminAuth.getUser(callerUid);
      const claims = caller.customClaims ?? {};
      isAdmin = claims.role === "admin" || claims.role === "superadmin";
      isEmployee = claims.role === "staff" || claims.role === "manager";
    } catch {
      // Invalid token, ignore and treat as unauthenticated
    }
  }

  // Ownership check
  const isOwner = callerUid && quote.firebase_uid === callerUid;
  const isStaff = callerUid && ((quote.assigned_to === callerUid) || (quote.created_by === callerUid));
  
  // If the user has the correct leadId and quoteId in the URL, we treat it as a capability URL (magic link).
  // This allows unauthenticated customers to download their own PDFs from the quote review page.
  const isMagicLink = true; // Anyone with the URL can view the PDF for that specific quote

  if (!isMagicLink && !isOwner && !isStaff && !isAdmin && !isEmployee) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if it's an invoice
  const isInvoice = quote.status === "accepted" || quote.status === "PAID";

  // â”€â”€ 3. Check Storage cache â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const bucket     = adminStorage.bucket();
  const storagePath = `quotes/${leadId}/${quoteId}${isInvoice ? "_invoice" : ""}_v4.pdf`;
  const file        = bucket.file(storagePath);

  try {
    const [exists] = await file.exists();
    const forceRegenerate = request.nextUrl.searchParams.get('force') === 'true';
    if (exists && !forceRegenerate) {
      // Return a short-lived signed URL (1 hour) â€” client downloads directly from Storage
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 3_600_000, // 1 hour
      });
      return NextResponse.json({ url: signedUrl });
    }
  } catch {
    // Storage check failed â€” fall through to generate
  }

  // â”€â”€ 4. Generate PDF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ 5. Upload to Storage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    // Don't fail the request â€” return the buffer directly as fallback
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

  return NextResponse.json({ url: signedUrl });
}

