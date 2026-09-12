import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { CustomerDashboardClient, type CustomerQuoteItem } from "@/components/customer/CustomerDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Dashboard | TEAM CCTV",
  description: "View your CCTV quotations, installation progress, and invoices.",
};

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const session = await verifySession();

  if (!session.isAuthenticated || session.role !== "customer") {
    redirect("/customer/login?redirect=/customer/dashboard");
  }

  const uid = session.user?.uid;
  const phoneNumber = session.user?.phone_number;
  const rawMobile = phoneNumber ? phoneNumber.replace(/^\+?91/, "").trim() : "";

  // 1. Fetch leads linked to this customer UID
  let leadsSnap = await adminDb.collection("leads").where("firebase_uid", "==", uid).get();

  // If no leads found by UID, check by mobile number as fallback
  if (leadsSnap.empty && rawMobile) {
    leadsSnap = await adminDb.collection("leads").where("mobile_number", "==", rawMobile).get();
  }

  let customerName = session.user?.name || "Valued Client";
  if (!leadsSnap.empty && customerName === "Valued Client") {
    customerName = leadsSnap.docs[0].data().customer_name || "Valued Client";
  }

  // 2. Collect quotes
  const quotesList: CustomerQuoteItem[] = [];
  const processedQuoteIds = new Set<string>();

  for (const leadDoc of leadsSnap.docs) {
    const leadData = leadDoc.data();
    const leadId = leadDoc.id;
    const quoteIds: string[] = Array.isArray(leadData.quote_ids) 
      ? leadData.quote_ids 
      : (leadData.latest_quote_id ? [leadData.latest_quote_id] : []);

    for (const quoteId of quoteIds) {
      if (processedQuoteIds.has(quoteId)) continue;
      processedQuoteIds.add(quoteId);

      // Check root quotes collection
      let qDoc = await adminDb.collection("quotes").doc(quoteId).get();
      if (!qDoc.exists) {
        // Fallback to subcollection
        qDoc = await leadDoc.ref.collection("quotes").doc(quoteId).get();
      }

      if (qDoc.exists) {
        const qData = qDoc.data()!;
        const status = qData.status || "GENERATED";
        const isPaid = status === "PAID" || status === "BOOKED" || !!qData.payment_id || !!qData.advance_paid;

        let createdStr = new Date().toISOString();
        if (qData.createdAt) {
          createdStr = typeof qData.createdAt === "string" ? qData.createdAt : qData.createdAt.toISOString?.() || createdStr;
        } else if (qData._serverCreatedAt?.toDate) {
          createdStr = qData._serverCreatedAt.toDate().toISOString();
        }

        quotesList.push({
          quoteId: qDoc.id,
          leadId,
          createdAt: createdStr,
          totalPayable: qData.total_payable || qData.pricingSnapshot?.total_payable || 0,
          status,
          cameraCount: qData.requirementSnapshot?.camera_count || leadData.camera_count || 0,
          propertyType: qData.requirementSnapshot?.property_type || leadData.property_type || "Commercial / Home",
          isPaid,
          customerName: qData.customer_name || leadData.customer_name,
        });
      }
    }
  }

  // Sort descending by creation date
  quotesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <CustomerDashboardClient
      user={{
        uid: uid || "",
        mobile: rawMobile,
        name: customerName,
      }}
      quotes={quotesList}
    />
  );
}
