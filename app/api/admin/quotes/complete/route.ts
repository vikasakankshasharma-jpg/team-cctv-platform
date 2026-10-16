import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp, arrayUnion } from "@/lib/firebase-admin";
import { calculatePricing } from "@/lib/pricing-engine";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";
import { Product, Addon, AppSettings, Lead } from "@/types";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logs";
import { ApiResponse } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/auth-server";
import { mergeAppSettings } from "@/lib/cached-settings";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoleApi(["super_admin", "admin", "sales_staff", "salesperson", "operations_manager"]);

    const body = await request.json();
    const { 
      quoteId, 
      leadId, 
      camera_count = 4, 
      technology = "HD", 
      recording_days = 15,
      picture_quality = "good",
      plan_type = "recommended",
      brand_preference = "Mixed (Best Price)",
      site_surcharge_flags = {},
      discount_amount = 0,
      notes = ""
    } = body;

    const actualQuoteId = quoteId || leadId;
    const actualLeadId = leadId || quoteId;

    if (!actualQuoteId) {
      return ApiResponse.badRequest("Missing quoteId or leadId");
    }

    if (!adminDb) {
      return ApiResponse.error("Database not initialized", "INTERNAL_ERROR", 500);
    }

    // 1. Fetch Quote and Lead
    let quoteRef = adminDb.collection("quotes").doc(actualQuoteId);
    let quoteDoc = await quoteRef.get();
    let leadRef = adminDb.collection("leads").doc(actualLeadId);
    let leadDoc = await leadRef.get();

    // If quote wasn't at root, check subcollection
    if (!quoteDoc.exists && leadDoc.exists) {
      const subQuoteRef = leadRef.collection("quotes").doc(actualQuoteId);
      const subQuoteDoc = await subQuoteRef.get();
      if (subQuoteDoc.exists) {
        quoteDoc = subQuoteDoc;
        quoteRef = subQuoteRef;
      }
    }

    const quoteData = quoteDoc.exists ? quoteDoc.data() : null;
    const leadData = leadDoc.exists ? (leadDoc.data() as Lead) : null;

    if (!quoteData && !leadData) {
      return ApiResponse.error("Quote or Lead not found", "NOT_FOUND", 404);
    }

    // Check if quote is already locked / completed
    const isPaid = quoteData?.status === "PAID" || quoteData?.status === "BOOKED" || quoteData?.leadStatus === "WON" || (leadData?.status as string) === "won" || (leadData?.status as string) === "PAID" || (leadData?.status as string) === "BOOKED";
    if (isPaid) {
      return ApiResponse.error("Completed and paid quotations are locked. Please use 'Create Revision' instead.", "VALIDATION_ERROR", 400);
    }

    // 2. Fetch Catalog and Settings
    const [productsSnap, addonsSnap, settingsSnap, geoRulesSnap] = await Promise.all([
      adminDb.collection("products").where("is_active", "==", true).get(),
      adminDb.collection("addons").where("is_active", "==", true).get(),
      adminDb.collection("settings").doc(SETTINGS_DOC_ID).get(),
      adminDb.collection("geo_pricing_rules").where("is_active", "==", true).get()
    ]);

    const products = productsSnap.docs.map(d => {
      const data = d.data() as any;
      if (!Array.isArray(data.technologies)) {
        data.technologies = data.technology ? [data.technology] : ["Common"];
      }
      return { id: d.id, ...data };
    }).filter(p => (p as any).is_deleted !== true) as Product[];

    const addons = addonsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Addon[];
    const geoRules = geoRulesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    const settings = mergeAppSettings(settingsSnap.data() as AppSettings);

    // Resolution mapping
    let resolution = "2MP";
    if (picture_quality === "very_clear") resolution = "5MP";
    if (picture_quality === "crystal_clear") resolution = "8MP";

    // 3. Compute Authoritative Pricing
    const selection: any = {
      plan_type,
      technology: technology === "IP" ? "IP" : "HD",
      camera_count: Math.max(1, Math.min(64, Number(camera_count))),
      storage_days: Number(recording_days) || 15,
      brand_preference: brand_preference || "Mixed (Best Price)",
      picture_quality: picture_quality || "good",
      resolution_preference: resolution,
      selected_addons: []
    };

    let appliedReferralDiscount = 0;
    if (leadData?.referral_code) {
      appliedReferralDiscount = settings.customer_referral_discount_percent ?? 3;
    }

    const pricing = calculatePricing({
      selection,
      products,
      addons,
      settings,
      cablingDone: false,
      site_surcharge_flags: site_surcharge_flags || {},
      referralDiscountPercent: appliedReferralDiscount,
      referralDiscountFlat: Math.max(0, Number(discount_amount) || 0),
      geoRules,
      locationParams: {
        pincode: leadData?.address?.pincode
      }
    });

    const cleanPricing = JSON.parse(JSON.stringify(pricing));

    // 4. Update or Create Authoritative Quote Document
    const targetQuoteId = quoteDoc.exists ? quoteDoc.id : `QT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const targetQuoteRef = adminDb.collection("quotes").doc(targetQuoteId);

    const quoteUpdatePayload: any = {
      id: targetQuoteId,
      lead_id: actualLeadId,
      leadId: actualLeadId,
      customer_name: quoteData?.customer_name || leadData?.customer_name || "Customer",
      customer_mobile: quoteData?.customer_mobile || leadData?.mobile_number || "",
      requirementSnapshot: {
        camera_count: selection.camera_count,
        recording_days: selection.storage_days,
        technology_preference: selection.technology,
        picture_quality: selection.picture_quality,
        notes: notes || "Quotation completed by admin"
      },
      configurationSnapshot: {
        items: cleanPricing.items || []
      },
      pricingSnapshot: cleanPricing,
      total_payable: cleanPricing.total_payable,
      plan_type: selection.plan_type,
      technology: selection.technology,
      selectedPlan: selection.plan_type,
      status: "GENERATED",
      leadStatus: "QUOTATION_SENT",
      site_surcharge_flags: site_surcharge_flags || {},
      completed_at: new Date().toISOString(),
      completed_by: {
        uid: session.user?.uid || "unknown",
        role: session.role || "admin",
        email: session.user?.email || null,
        name: session.user?.name || "Admin"
      },
      updatedAt: new Date().toISOString()
    };

    await targetQuoteRef.set(quoteUpdatePayload, { merge: true });

    // Also update lead doc
    if (leadDoc.exists) {
      await leadRef.update({
        status: "quoted",
        leadStatus: "QUOTATION_SENT",
        latest_quote_id: targetQuoteId,
        last_quote_id: targetQuoteId,
        quote_ids: arrayUnion(targetQuoteId),
        requirementSnapshot: quoteUpdatePayload.requirementSnapshot,
        pricingSnapshot: cleanPricing,
        total_payable: cleanPricing.total_payable,
        updated_at: serverTimestamp()
      });
    }

    // 5. Enterprise Audit Logging
    const { ip, ua } = getRequestMetadata(request);
    await createAuditLog({
      action: "QUOTE_RECALCULATE",
      actor_id: session.user?.uid || "unknown",
      resource_id: targetQuoteId,
      resource_type: "quote",
      ip_address: ip,
      user_agent: ua,
      metadata: {
        lead_id: actualLeadId,
        total_payable: cleanPricing.total_payable,
        camera_count: selection.camera_count,
        technology: selection.technology,
        action_note: "Quotation completed and finalized by admin"
      }
    });

    return ApiResponse.success({
      quoteId: targetQuoteId,
      total_payable: cleanPricing.total_payable,
      message: "Quotation completed and finalized successfully",
      data: cleanPricing
    }, 200);

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return ApiResponse.unauthorized();
    }
    console.error("Critical error in complete quote:", error);
    return ApiResponse.error("Internal server error", "INTERNAL_ERROR", 500, error.message);
  }
}
