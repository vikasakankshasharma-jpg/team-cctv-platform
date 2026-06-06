import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ApiResponse } from "@/lib/api-response";
import { verifySession } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated || (session.role !== "sales_staff" && session.role !== "super_admin")) {
    return ApiResponse.forbidden("Unauthorized");
  }

  try {
    const body = await req.json();
    const { 
      lead_id, items, addons, discount_percent, discount_amount, 
      subtotal, total_payable, installation_cost, note,
      total_purchase_cost, gross_profit_value, gross_profit_percent 
    } = body;

    if (!lead_id || !items || items.length === 0) {
      return ApiResponse.badRequest("Missing required fields");
    }

    // Validate discount percentage against salesperson's max limit
    if (session.role === "sales_staff" && session.user?.uid) {
      const spSnap = await adminDb.collection("salespeople").where("firebase_uid", "==", session.user.uid).limit(1).get();
      if (!spSnap.empty) {
        const sp = spSnap.docs[0].data();
        const maxDiscount = sp.max_discount_approval_percent || 0;
        if (discount_percent > maxDiscount) {
          return ApiResponse.badRequest(`Discount exceeds your authorized limit of ${maxDiscount}%`);
        }
      }
    }

    // Persist the manual quote
    const quoteRef = adminDb.collection("leads").doc(lead_id).collection("quotes").doc();
    await quoteRef.set({
      items,
      addons: addons || [],
      subtotal,
      discount_percent: discount_percent || 0,
      discount_amount: discount_amount || 0,
      installation_cost: installation_cost || 0,
      cabling_cost: 0,
      total_payable,
      plan_type: "custom",
      technology: "custom",
      configuration_snapshot: items,
      addons_snapshot: addons || [],
      expected_total_payable: total_payable,
      
      // Margin Intelligence
      total_purchase_cost: total_purchase_cost || 0,
      gross_profit_value: gross_profit_value || 0,
      gross_profit_percent: gross_profit_percent || 0,

      status: "draft",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_manual_quote: true,
      salesperson_note: note || ""
    });

    await adminDb.collection("leads").doc(lead_id).update({
      status: "quoted",
      last_quote_id: quoteRef.id
    });

    return ApiResponse.success({ id: quoteRef.id, message: "Manual Quote generated successfully" }, 201);
  } catch (err: any) {
    console.error("[Manual Quote Error]", err);
    return ApiResponse.error("Failed to generate manual quote", "INTERNAL_ERROR", 500, err.message);
  }
}
