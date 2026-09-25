import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { CustomerDashboardClient, type CustomerQuoteItem } from "@/components/customer/CustomerDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Dashboard | TEAM CCTV",
  description: "View your CCTV quotations, installation progress, and invoices.",
};

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const session = await verifySession();

  if (!session.isAuthenticated) {
    redirect("/customer/login?redirect=/customer/dashboard");
  }

  const uid = session.user?.uid || session.uid;
  let phoneNumber = session.user?.phone_number;

  // If phone_number is not in session token, fetch from Firebase Auth UserRecord
  if (!phoneNumber && uid) {
    try {
      const userRecord = await adminAuth.getUser(uid);
      phoneNumber = userRecord.phoneNumber;
    } catch (e) {
      console.warn("[CustomerDashboard] Could not fetch user record:", e);
    }
  }

  const rawMobile = phoneNumber ? String(phoneNumber).replace(/\D/g, "").slice(-10) : "";

  // ────────────────────────────────────────────────────────────
  // 1. FETCH ALL LEADS LINKED TO THIS CUSTOMER (by UID or Phone)
  // ────────────────────────────────────────────────────────────
  const leadDocsMap = new Map<string, any>();

  if (uid) {
    const snapByUid = await adminDb.collection("leads").where("firebase_uid", "==", uid).get();
    snapByUid.docs.forEach((d) => leadDocsMap.set(d.id, { id: d.id, ...d.data() }));
  }

  if (rawMobile) {
    const [snapByMobile, snapByCustPhone] = await Promise.all([
      adminDb.collection("leads").where("mobile_number", "==", rawMobile).get(),
      adminDb.collection("leads").where("customer_phone", "==", rawMobile).get(),
    ]);

    snapByMobile.docs.forEach((d) => leadDocsMap.set(d.id, { id: d.id, ...d.data() }));
    snapByCustPhone.docs.forEach((d) => leadDocsMap.set(d.id, { id: d.id, ...d.data() }));
  }

  const allLeads = Array.from(leadDocsMap.values());

  let customerName = session.user?.name || "Valued Client";
  if (customerName === "Valued Client" && allLeads.length > 0) {
    customerName = allLeads[0].customer_name || allLeads[0].name || "Valued Client";
  }

  // ────────────────────────────────────────────────────────────
  // 2. DISCOVER ALL QUOTES (Direct Query on Quotes + Lead Quotes)
  // ────────────────────────────────────────────────────────────
  const quoteDocsMap = new Map<string, any>();

  // A. Direct query on root quotes collection by customer mobile
  if (rawMobile) {
    try {
      const quotesByMobileSnap = await adminDb
        .collection("quotes")
        .where("customer_mobile", "in", [rawMobile, `+91${rawMobile}`])
        .get();
      quotesByMobileSnap.docs.forEach((d) => quoteDocsMap.set(d.id, { id: d.id, ...d.data() }));
    } catch {
      const fallbackSnap = await adminDb
        .collection("quotes")
        .where("customer_mobile", "==", rawMobile)
        .get();
      fallbackSnap.docs.forEach((d) => quoteDocsMap.set(d.id, { id: d.id, ...d.data() }));
    }
  }

  // B. Direct query on root quotes collection by UID
  if (uid) {
    try {
      const quotesByUidSnap = await adminDb.collection("quotes").where("firebase_uid", "==", uid).get();
      quotesByUidSnap.docs.forEach((d) => quoteDocsMap.set(d.id, { id: d.id, ...d.data() }));
    } catch {
      // Ignored if index not available
    }
  }

  // C. Extract quote IDs explicitly attached to leads
  for (const lead of allLeads) {
    const candidateIds: string[] = [];
    if (lead.won_quote_id) candidateIds.push(lead.won_quote_id);
    if (lead.latest_quote_id) candidateIds.push(lead.latest_quote_id);
    if (lead.last_quote_id) candidateIds.push(lead.last_quote_id);

    if (Array.isArray(lead.quote_ids)) {
      candidateIds.push(...lead.quote_ids.filter((id: any) => typeof id === "string"));
    }

    if (Array.isArray(lead.quotes)) {
      lead.quotes.forEach((qItem: any) => {
        if (typeof qItem === "string") candidateIds.push(qItem);
        else if (qItem?.quoteId) candidateIds.push(qItem.quoteId);
        else if (qItem?.id) candidateIds.push(qItem.id);
      });
    }

    for (const qId of candidateIds) {
      if (!quoteDocsMap.has(qId)) {
        // Look up in root quotes collection
        const rootDoc = await adminDb.collection("quotes").doc(qId).get();
        if (rootDoc.exists) {
          quoteDocsMap.set(rootDoc.id, { id: rootDoc.id, lead_id: lead.id, ...rootDoc.data() });
        } else {
          // Look up in subcollection
          const subDoc = await adminDb.collection("leads").doc(lead.id).collection("quotes").doc(qId).get();
          if (subDoc.exists) {
            quoteDocsMap.set(subDoc.id, { id: subDoc.id, lead_id: lead.id, ...subDoc.data() });
          }
        }
      }
    }
  }

  // ────────────────────────────────────────────────────────────
  // 3. CROSS-REFERENCE INVOICES & BUILD FINAL UNIFIED LIST
  // ────────────────────────────────────────────────────────────
  const quotesList: CustomerQuoteItem[] = [];

  for (const [quoteId, qData] of quoteDocsMap.entries()) {
    // Resolve matching lead for address and context
    const matchingLead =
      allLeads.find((l) => l.id === qData.lead_id || l.id === qData.leadId) ||
      allLeads[0] ||
      {};

    const leadId = qData.lead_id || qData.leadId || matchingLead?.id || quoteId;

    // Check if an invoice document exists in "invoices" collection
    let invData: any = null;
    const invDoc = await adminDb.collection("invoices").doc(quoteId).get();
    if (invDoc.exists) {
      invData = invDoc.data();
    }

    const totalPayable = Number(
      invData?.total_amount ??
      qData.pricingSnapshot?.total_payable ??
      qData.total_payable ??
      qData.total ??
      matchingLead?.total_payable ??
      0
    );

    const isPaid =
      qData.status === "PAID" ||
      qData.status === "BOOKED" ||
      invData?.status === "PAID" ||
      invData?.status === "BOOKED" ||
      !!qData.paid_at ||
      !!invData?.payment_id ||
      qData.payment_status === "advance_paid" ||
      qData.payment_status === "paid" ||
      (qData.amount_paid || 0) >= 500;

    const amountPaid = Number(
      invData?.amount_paid ??
      qData.amount_paid ??
      (isPaid ? 500 : 0)
    );

    const amountDue = isPaid && (qData.status === "PAID" || invData?.status === "PAID")
      ? 0
      : Number(invData?.amount_due ?? qData.amount_due ?? Math.max(0, totalPayable - amountPaid));

    let createdStr = new Date().toISOString();
    if (qData.createdAt) {
      createdStr = typeof qData.createdAt === "string" ? qData.createdAt : qData.createdAt.toISOString?.() || createdStr;
    } else if (qData._serverCreatedAt?.toDate) {
      createdStr = qData._serverCreatedAt.toDate().toISOString();
    } else if (invData?.created_at) {
      createdStr = invData.created_at;
    }

    const cameraCount =
      qData.requirementSnapshot?.camera_count ||
      qData.camera_count ||
      matchingLead?.camera_count ||
      0;

    const propertyType =
      qData.requirementSnapshot?.property_type ||
      qData.property_type ||
      matchingLead?.property_type ||
      "Residential / Commercial";

    const siteAddress =
      qData.address?.street ||
      qData.billing_details?.address_line1 ||
      matchingLead?.address?.full_address ||
      matchingLead?.address?.street ||
      matchingLead?.detected_city ||
      "Jaipur";

    quotesList.push({
      quoteId,
      leadId,
      createdAt: createdStr,
      totalPayable,
      status: qData.status || invData?.status || "GENERATED",
      cameraCount,
      propertyType,
      siteAddress,
      isPaid,
      customerName: qData.customer_name || qData.billing_details?.customer_name || matchingLead?.customer_name || customerName,
      amountPaid,
      amountDue,
      rawLead: matchingLead,
      rawQuote: qData,
    });
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
