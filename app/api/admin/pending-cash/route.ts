import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const [staffSnap, installerSnap] = await Promise.all([
      adminDb.collection("quotes").where("cash_collection_status", "==", "COLLECTED_BY_STAFF").get(),
      adminDb.collection("quotes").where("installer_cash_status", "==", "COLLECTED_BY_INSTALLER").get()
    ]);

    const holdings: any[] = [];
    
    staffSnap.docs.forEach(doc => {
      const data = doc.data();
      holdings.push({
        quote_id: doc.id,
        staff_name: data.assigned_delivery_staff?.name || "Delivery Staff",
        staff_phone: data.assigned_delivery_staff?.phone || "",
        amount: data.cash_collected_amount || 0,
        type: "DELIVERY"
      });
    });
    
    installerSnap.docs.forEach(doc => {
      const data = doc.data();
      holdings.push({
        quote_id: doc.id,
        staff_name: data.assigned_installer?.name || "Installer",
        staff_phone: data.assigned_installer?.phone || "",
        amount: data.installer_cash_amount || 0,
        type: "INSTALLER"
      });
    });

    return NextResponse.json({ success: true, pendingCashQuotes: holdings });
  } catch (error: any) {
    console.error("Pending cash error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
