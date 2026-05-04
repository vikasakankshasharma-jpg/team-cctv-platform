import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

export async function GET() {
  try {
    const testPartner = {
      name: "Test Partner Agent",
      business_name: "Antigravity Testing Ltd",
      referral_code: "AG-TEST-001",
      email: "test-partner@example.com",
      mobile_number: "9999999999",
      is_active: true,
      use_global_commission: true,
      commission_slabs: [
        { from: 0, to: 50000, value: 5, type: "percent" },
        { from: 50001, to: 200000, value: 8, type: "percent" },
        { from: 200001, to: null, value: 10, type: "percent" }
      ],
      total_leads_referred: 0,
      total_ex_tax_business: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const docRef = await adminDb.collection(COLLECTIONS.PROMOTERS).add(testPartner);

    return NextResponse.json({ 
      success: true, 
      partnerId: docRef.id,
      referralCode: "AG-TEST-001",
      email: "test-partner@example.com"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
