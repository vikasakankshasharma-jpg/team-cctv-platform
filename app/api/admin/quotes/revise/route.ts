import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { calculatePricing } from "@/lib/pricing-engine";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";
import { GenerateQuoteSchema } from "@/lib/validators";
import { Product, Addon, AppSettings, Lead } from "@/types";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logs";
import { ApiResponse } from "@/lib/api-response";
// import { requireAdminServer } from "@/lib/auth-server";

/**
 * ADMIN QUOTE REVISION API
 * Allows staff to generate a v2/v3 of a quotation post site-visit.
 */
export async function POST(request: NextRequest) {
  const { success } = await rateLimit(request);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const body = await request.json();
    const { lead_id, parent_quote_id, revision_notes, status } = body;

    // 1. Validate Input Structure
    const validation = GenerateQuoteSchema.safeParse(body.selection);
    if (!validation.success) {
      return ApiResponse.badRequest("Invalid selection payload", validation.error.format());
    }

    const selection = validation.data;

    if (!lead_id || !parent_quote_id) {
      return ApiResponse.badRequest("Missing lead_id or parent_quote_id");
    }

    if (!adminDb) {
       return ApiResponse.error("Database not initialized", "INTERNAL_ERROR", 500);
    }

    // 2. Fetch Authoritative Data
    const [leadDoc, parentQuoteDoc, productsSnap, addonsSnap, settingsSnap, geoRulesSnap] = await Promise.all([
      adminDb.collection("leads").doc(lead_id).get(),
      adminDb.collection("leads").doc(lead_id).collection("quotes").doc(parent_quote_id).get(),
      adminDb.collection("products").where("is_active", "==", true).where("is_deleted", "==", false).get(),
      adminDb.collection("addons").where("is_active", "==", true).where("is_deleted", "==", false).get(),
      adminDb.collection("settings").doc(SETTINGS_DOC_ID).get(),
      adminDb.collection("geo_pricing_rules").where("is_active", "==", true).get()
    ]);

    if (!leadDoc.exists || !parentQuoteDoc.exists) {
      return ApiResponse.error("Lead or Parent Quote not found", "NOT_FOUND", 404);
    }

    const leadData = leadDoc.data() as Lead;
    const parentQuoteData = parentQuoteDoc.data() as any;
    const currentVersion = parentQuoteData.version || 1;
    const newVersion = currentVersion + 1;

    const products = productsSnap.docs.map(d => {
      const data = d.data() as any;
      if (!Array.isArray(data.technologies)) {
        data.technologies = data.technology ? [data.technology] : ["Common"];
      }
      return { id: d.id, ...data };
    }) as Product[];
    
    const addons = addonsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Addon[];
    const geoRules = geoRulesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    const settings = settingsSnap.data() as AppSettings;

    if (!selection.resolution_preference && selection.picture_quality) {
      if (selection.picture_quality === "good") selection.resolution_preference = "2MP";
      else if (selection.picture_quality === "very_clear") selection.resolution_preference = "5MP";
      else if (selection.picture_quality === "crystal_clear") selection.resolution_preference = "8MP";
    }

    // 3. SERVER-SIDE PRICE RECALCULATION
    const pricing = calculatePricing({
      selection: selection as any,
      products,
      addons,
      settings,
      cablingDone: leadData.cabling_done || false,
      referralDiscountPercent: 0,
      referralDiscountFlat: 0,
      activeOffer: leadData.active_offer,
      geoRules,
      locationParams: {
        pincode: leadData.address?.pincode
      }
    });

    const cleanPricing = JSON.parse(JSON.stringify(pricing));
    
    // 4. PERSIST NEW QUOTE TO DATABASE
    const quoteRef = adminDb.collection("leads").doc(lead_id).collection("quotes").doc();

    const quotePromise = quoteRef.set({
      ...cleanPricing,
      plan_type: selection.plan_type,
      technology: selection.technology,
      configuration_snapshot: cleanPricing.items, 
      addons_snapshot: cleanPricing.addons,
      
      // Versioning fields
      version: newVersion,
      parent_quote_id: parent_quote_id,
      is_revision: true,
      revision_notes: revision_notes || "Revised by admin after site visit",
      
      status: status || "draft",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      recalculated_on_server: true,
    });

    // 5. Update Lead Status
    const leadPromise = adminDb.collection("leads").doc(lead_id).update({ 
      status: "quoted",
      last_quote_id: quoteRef.id,
      updated_at: serverTimestamp()
    });

    await Promise.all([quotePromise, leadPromise]);

    // 6. Enterprise Audit Logging
    const { ip, ua } = getRequestMetadata(request);
    await createAuditLog({
      action: "QUOTE_REVISE",
      actor_id: "admin_or_installer",
      resource_id: quoteRef.id,
      resource_type: "quote",
      ip_address: ip,
      user_agent: ua,
      metadata: {
        total_payable: pricing.total_payable,
        parent_quote_id: parent_quote_id,
        version: newVersion,
        lead_id
      }
    });

    return ApiResponse.success({ 
      id: quoteRef.id, 
      version: newVersion,
      message: "Revised Quote generated and saved successfully",
      total_payable: pricing.total_payable 
    }, 201);

  } catch (error: any) {
    console.error("Critical error in quote revision:", error);
    return ApiResponse.error("Internal server error", "INTERNAL_ERROR", 500, error.message);
  }
}
