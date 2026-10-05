import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireRoleApi } from "@/lib/auth-server";

export async function GET() {
  try {
    await requireRoleApi(["admin", "super_admin"]);

    // 1. Fetch Promoter Pending Commissions
    const promoterSnap = await adminDb
      .collection("commission_records")
      .where("status", "==", "pending")
      .get();

    // 2. Fetch Installer Pending Commissions
    const installerSnap = await adminDb
      .collection("commissions")
      .where("user_type", "==", "installer")
      .where("status", "==", "pending")
      .get();

    const now = new Date().getTime();

    // 3. Process Promoter Payouts
    const promoterPayoutsPromises = promoterSnap.docs.map(async (doc) => {
      const data = doc.data();
      const createdAt = data.created_at?.toDate?.()?.getTime() || new Date(data.created_at).getTime();
      const overdue_days = Math.max(0, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));
      
      let promoterDetails = { name: "Unknown", bank: null };
      if (data.promoter_id) {
        try {
          const pDoc = await adminDb.collection("promoters").doc(data.promoter_id).get();
          if (pDoc.exists) {
             const pData = pDoc.data()!;
             promoterDetails.name = pData.name || pData.business_name || "Unknown";
             promoterDetails.bank = pData.bank_details || null;
          }
        } catch (e) {}
      }

      return {
        id: doc.id,
        type: "promoter",
        recipient_id: data.promoter_id,
        recipient_name: promoterDetails.name,
        bank_details: promoterDetails.bank,
        lead_id: data.lead_id,
        amount: data.commission_amount,
        created_at: new Date(createdAt).toISOString(),
        overdue_days,
        source_collection: "commission_records"
      };
    });

    // 4. Process Installer Payouts
    const installerPayoutsPromises = installerSnap.docs.map(async (doc) => {
      const data = doc.data();
      const createdAt = data.created_at?.toDate?.()?.getTime() || new Date(data.created_at).getTime();
      const overdue_days = Math.max(0, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));
      
      let installerDetails = { name: "Unknown", bank: null as any };
      if (data.user_id) {
        try {
          const iDoc = await adminDb.collection("installers").doc(data.user_id).get();
          if (iDoc.exists) {
             const iData = iDoc.data()!;
             installerDetails.name = iData.name || iData.company_name || "Unknown";
             
             if (iData.bank_account || iData.bank_ifsc) {
               installerDetails.bank = {
                 account_number: iData.bank_account || "",
                 ifsc_code: iData.bank_ifsc || "",
                 account_name: iData.name || iData.company_name || ""
               };
             }
          }
        } catch (e) {}
      }

      return {
        id: doc.id,
        type: "installer",
        recipient_id: data.user_id,
        recipient_name: installerDetails.name,
        bank_details: installerDetails.bank,
        lead_id: data.lead_id,
        amount: data.commission_amount,
        created_at: new Date(createdAt).toISOString(),
        overdue_days,
        source_collection: "commissions"
      };
    });

    const [promoterPayouts, installerPayouts] = await Promise.all([
      Promise.all(promoterPayoutsPromises),
      Promise.all(installerPayoutsPromises)
    ]);

    // Combine and sort by oldest overdue first
    const unifiedPayouts = [...promoterPayouts, ...installerPayouts].sort((a, b) => b.overdue_days - a.overdue_days);

    return NextResponse.json({ success: true, data: unifiedPayouts });
  } catch (error: any) {
    console.error("[Finance Payouts API]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
