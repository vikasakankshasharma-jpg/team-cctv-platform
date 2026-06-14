import { NextRequest } from "next/server";
import { adminDb, adminAuth, serverTimestamp } from "@/lib/firebase-admin";
import { ApiResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return ApiResponse.forbidden("Missing or invalid authorization token");
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      return ApiResponse.forbidden("Invalid token");
    }

    // Role check
    const caller = await adminAuth.getUser(decodedToken.uid);
    const role = caller.customClaims?.role || "user";
    if (role !== "super_admin" && role !== "admin" && role !== "manager" && role !== "sales_staff") {
      return ApiResponse.forbidden("You do not have permission to create custom quotes.");
    }

    const body = await request.json();
    const { leadId, lineItems, gstPercent, advancePercent, notes, total_payable } = body;

    if (!leadId || !lineItems || !Array.isArray(lineItems)) {
      return ApiResponse.badRequest("Invalid payload. Missing leadId or lineItems.");
    }

    const quoteRef = adminDb.collection("leads").doc(leadId).collection("quotes").doc();
    
    // Convert line items to the shape expected by the quote review UI
    const items = lineItems.map((item: any) => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      display_name: item.name,
      technology: item.badge?.label || "",
      resolution_tier: item.description,
      qty: item.quantity,
      unit_price: item.unitPrice,
    }));

    const quotePromise = quoteRef.set({
      quote_number: quoteRef.id.slice(0, 8).toUpperCase(),
      items,
      line_items: items.map((i: any) => ({
        id: i.id,
        name: i.display_name,
        description: i.resolution_tier,
        quantity: i.qty,
        unitPrice: i.unit_price
      })),
      addons: [], // keep empty since items has everything
      labor_cost: 0,
      cabling_cost: 0,
      total_payable: total_payable || 0,
      gst_percent: gstPercent || 18,
      advance_percent: advancePercent || 30,
      notes: notes || "",
      status: "draft",
      created_by: decodedToken.uid,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      is_custom_quote: true,
    });

    const leadPromise = adminDb.collection("leads").doc(leadId).update({
      status: "quoted",
      last_quote_id: quoteRef.id,
      updated_at: serverTimestamp()
    });

    await Promise.all([quotePromise, leadPromise]);

    return ApiResponse.success({ 
      id: quoteRef.id, 
      message: "Custom quote created successfully"
    }, 201);

  } catch (error: any) {
    console.error("Error creating custom quote:", error);
    return ApiResponse.error("Internal server error", "INTERNAL_ERROR", 500, error.message);
  }
}
