import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { calculatePricing } from "@/lib/pricing-engine";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";
import { GenerateQuoteSchema } from "@/lib/validators";
import { Product, Addon, AppSettings, Lead } from "@/types";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logs";
import { ApiResponse } from "@/lib/api-response";

/** 
 * ENTERPRISE-GRADE QUOTE PERSISTENCE
 * Implements Zero-Trust Price Validation by recalculating all costs on the server.
 */
export async function POST(request: NextRequest) {
  const { success } = await rateLimit(request);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const body = await request.json();
    
    // 1. Validate Input Structure
    const validation = GenerateQuoteSchema.safeParse(body.selection);
    if (!validation.success) {
      return ApiResponse.badRequest("Invalid selection payload", validation.error.format());
    }

    const { lead_id, firebase_uid, address, status, accepted_at } = body;
    const selection = validation.data;

    if (!lead_id) {
      return ApiResponse.badRequest("Missing lead_id");
    }

    if (!adminDb) {

       return ApiResponse.error("Database not initialized", "INTERNAL_ERROR", 500);
    }
    
    // 2. Fetch Authoritative Data (Server-Side Source of Truth)
    const [leadDoc, productsSnap, addonsSnap, settingsSnap] = await Promise.all([
      adminDb.collection("leads").doc(lead_id).get(),
      adminDb.collection("products").where("is_active", "==", true).where("is_deleted", "==", false).get(),
      adminDb.collection("addons").where("is_active", "==", true).where("is_deleted", "==", false).get(),
      adminDb.collection("settings").doc(SETTINGS_DOC_ID).get()
    ]);

    if (!leadDoc.exists) {
      return ApiResponse.error("Lead not found", "NOT_FOUND", 404);
    }

    const leadData = leadDoc.data() as Lead;

    // Ownership verification
    if (firebase_uid && leadData.firebase_uid !== firebase_uid) {
      return ApiResponse.forbidden("Forbidden: Lead ownership mismatch");
    }

    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    const addons = addonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon));
    const settings = settingsSnap.data() as AppSettings;

    // 3. SERVER-SIDE PRICE RECALCULATION (IMMUTABLE BY CLIENT)
    const pricing = calculatePricing({
      selection,
      products,
      addons,
      settings,
      cablingDone: leadData.cabling_done || false,
      referralDiscountPercent: 0, // Injected via promoter lookup if needed
      referralDiscountFlat: 0,
      activeOffer: leadData.active_offer
    });

    // 4. Prepare and Save Quote
    const quoteRef = adminDb.collection("leads").doc(lead_id).collection("quotes").doc();

    const quotePromise = quoteRef.set({
      ...pricing,
      plan_type: selection.plan_type,
      technology: selection.technology,
      configuration_snapshot: pricing.items, 
      status: status || "draft",
      accepted_at: accepted_at ? new Date(accepted_at) : null,
      created_at: serverTimestamp(),
      recalculated_on_server: true,
    });

    // 5. Update Lead Status
    const updatePayload: Record<string, any> = { 
      status: status === "accepted" ? "accepted" : "quoted",
      last_quote_id: quoteRef.id,
      updated_at: serverTimestamp()
    };
    if (address) updatePayload.address = address;
    
    const leadPromise = adminDb.collection("leads").doc(lead_id).update(updatePayload);

    await Promise.all([quotePromise, leadPromise]);

    // 6. Enterprise Audit Logging
    const { ip, ua } = getRequestMetadata(request);
    await createAuditLog({
      action: status === "accepted" ? "QUOTE_ACCEPT" : "QUOTE_RECALCULATE",
      actor_id: firebase_uid || "guest",
      resource_id: quoteRef.id,
      resource_type: "quote",
      ip_address: ip,
      user_agent: ua,
      metadata: {
        total_payable: pricing.total_payable,
        plan_type: selection.plan_type,
        lead_id
      }
    });

    return ApiResponse.success({ 
      id: quoteRef.id, 
      message: "Quote recalculated and saved successfully",
      total_payable: pricing.total_payable 
    }, 201);

  } catch (error: any) {
    console.error("Critical error in quote persistence:", error);
    return ApiResponse.error("Internal server error", "INTERNAL_ERROR", 500, error.message);
  }
}
