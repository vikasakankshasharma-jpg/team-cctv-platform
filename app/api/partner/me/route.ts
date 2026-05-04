import { NextResponse } from "next/server";
import { requirePartnerSession } from "@/lib/auth-partner";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import type { Promoter } from "@/types";

export async function GET() {
  try {
    const session = await requirePartnerSession();

    const docSnap = await adminDb.collection(COLLECTIONS.PROMOTERS).doc(session.promoterId!).get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Partner profile not found." }, { status: 404 });
    }

    const data = docSnap.data() as Promoter;
    
    // We omit sensitive backend fields (like ID if it were there, or firebase_uid)
    const profile = {
      id: docSnap.id,
      name: data.name,
      business_name: data.business_name,
      referral_code: data.referral_code,
      email: data.email,
      mobile_number: data.mobile_number,
      is_active: data.is_active,
      total_ex_tax_business: data.total_ex_tax_business,
      total_won_leads: data.total_won_leads,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      use_global_commission: data.use_global_commission,
      commission_slabs: data.commission_slabs,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Error && error.message === "PARTNER_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Partner Me GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requirePartnerSession();
    const body = await req.json();

    const allowedUpdates: Partial<Promoter> = {};
    if (typeof body.name === "string") allowedUpdates.name = body.name;
    if (typeof body.email === "string") allowedUpdates.email = body.email;
    if (typeof body.mobile_number === "string") allowedUpdates.mobile_number = body.mobile_number;
    if (typeof body.business_name === "string") allowedUpdates.business_name = body.business_name;

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields provided for update." }, { status: 400 });
    }

    allowedUpdates.updated_at = new Date();

    await adminDb.collection(COLLECTIONS.PROMOTERS).doc(session.promoterId!).update(allowedUpdates);

    return NextResponse.json({ success: true, updatedFields: allowedUpdates });
  } catch (error) {
    if (error instanceof Error && error.message === "PARTNER_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Partner Me PATCH] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
