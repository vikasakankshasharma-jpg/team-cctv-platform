import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch all leads with address data
    const leadsSnap = await adminDb.collection("leads").get();
    
    const statsByPincode: Record<string, { 
      pincode: string, 
      total_leads: number, 
      won_leads: number, 
      revenue: number,
      has_franchise: boolean 
    }> = {};

    // 2. Aggregate
    leadsSnap.forEach(doc => {
      const data = doc.data();
      const pincode = data.address?.pincode || "unknown";
      const status = data.status || "new";
      const revenue = data.final_quote_amount || 0; // Assuming this field exists for won leads

      if (!statsByPincode[pincode]) {
        statsByPincode[pincode] = { 
          pincode, 
          total_leads: 0, 
          won_leads: 0, 
          revenue: 0,
          has_franchise: !!data.franchise_dealer_id 
        };
      }

      statsByPincode[pincode].total_leads += 1;
      if (status === "won") {
        statsByPincode[pincode].won_leads += 1;
        statsByPincode[pincode].revenue += revenue;
      }
      if (data.franchise_dealer_id) {
        statsByPincode[pincode].has_franchise = true;
      }
    });

    // 3. Sort by total leads descending
    const result = Object.values(statsByPincode).sort((a, b) => b.total_leads - a.total_leads);

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error("🔥 Territory Analytics Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
