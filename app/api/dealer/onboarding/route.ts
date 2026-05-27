import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { DealerOnboardingSchema } from "@/lib/validators";
import { COLLECTIONS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = DealerOnboardingSchema.parse(body);

    // Clean up pincodes
    const pincodes = validated.pincodes
      .split(",")
      .map(p => p.trim())
      .filter(p => p.length === 6 && /^\d+$/.test(p));

    if (pincodes.length === 0) {
      return NextResponse.json({
        success: false,
        error: { message: "Please provide at least one valid 6-digit pincode." }
      }, { status: 400 });
    }

    // Prepare FranchiseDealer shape (Pending state)
    const newApplication = {
      company_name: validated.company_name,
      owner_name: validated.owner_name,
      mobile_number: validated.mobile_number,
      email: validated.email,
      gst_number: validated.gst_number || null,
      assigned_cities: [validated.city],
      assigned_pincodes: pincodes,
      territory_exclusivity: true, // Requested by default
      is_active: false,
      status: "pending", // The magic field for applications
      franchise_fee_monthly: 0, // Admin sets this later
      commission_percent: 0, // Admin sets this later
      total_leads_received: 0,
      total_leads_won: 0,
      total_ex_tax_business: 0,
      total_commission_due: 0,
      total_commission_paid: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Save to franchise_dealers collection
    await adminDb.collection(COLLECTIONS.FRANCHISE_DEALERS).add(newApplication);

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() }, { status: 201 });
  } catch (error: any) {
    console.error("[DealerOnboarding API Error]", error);
    if (error.name === "ZodError") {
      return NextResponse.json({
        success: false,
        error: { message: "Validation failed", details: error.errors }
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      error: { message: "Internal server error" }
    }, { status: 500 });
  }
}
