import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "OPERATIONS", "SALES"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    // 1. Fetch collections concurrently
    const [subsSnap, contractsSnap, warrantiesSnap, leadsSnap, quotesSnap] = await Promise.all([
      adminDb.collection("amc_subscriptions").get().catch(() => ({ docs: [] })),
      adminDb.collection("amc_contracts").get().catch(() => ({ docs: [] })),
      adminDb.collection("warranties").get().catch(() => ({ docs: [] })),
      adminDb.collection("leads").orderBy("created_at", "desc").limit(150).get().catch(() => ({ docs: [] })),
      adminDb.collection("quotes").limit(150).get().catch(() => ({ docs: [] }))
    ]);

    // Fast lookup maps for customer info
    const leadsMap = new Map<string, any>();
    leadsSnap.docs.forEach((d: any) => leadsMap.set(d.id, d.data()));

    const quotesMap = new Map<string, any>();
    quotesSnap.docs.forEach((d: any) => quotesMap.set(d.id, d.data()));

    const unifiedList: any[] = [];
    const seenQuoteIds = new Set<string>();
    const seenDocIds = new Set<string>();

    const now = new Date();

    // Helper to calculate days left
    const getDaysLeft = (endDateStr: string) => {
      if (!endDateStr) return 0;
      const end = new Date(endDateStr);
      return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Helper to resolve customer info
    const resolveCustomer = (data: any, quoteId?: string, leadId?: string, customerId?: string) => {
      const q = quoteId ? quotesMap.get(quoteId) : null;
      const l = leadId ? leadsMap.get(leadId) : (customerId ? leadsMap.get(customerId) : null);

      const name = data.customerName || data.customer_name || q?.customer_name || l?.customer_name || "Valued Customer";
      const mobile = data.customerMobile || data.customer_mobile || data.customer_phone || q?.customer_phone || q?.customer_mobile || l?.customer_mobile || "";
      const email = data.customerEmail || data.customer_email || q?.customer_email || l?.customer_email || "";
      const address = data.siteAddress || data.address || q?.address || l?.address || (q?.city ? `${q.city}${q?.pincode ? ` - ${q.pincode}` : ""}` : "");
      
      return { name, mobile, email, address };
    };

    // A. Process amc_subscriptions
    subsSnap.docs.forEach((doc: any) => {
      const d = doc.data();
      const id = doc.id;
      seenDocIds.add(id);
      if (d.quoteId) seenQuoteIds.add(d.quoteId);

      const { name, mobile, email, address } = resolveCustomer(d, d.quoteId, d.leadId, d.customerId);
      const daysLeft = getDaysLeft(d.endDate);
      const isExpired = d.endDate ? new Date(d.endDate) < now : false;

      unifiedList.push({
        id,
        source: "amc_subscriptions",
        customerId: d.customerId || "",
        quoteId: d.quoteId || "",
        leadId: d.leadId || "",
        customerName: name,
        customerMobile: mobile,
        customerEmail: email,
        siteAddress: address,
        planName: d.planName || "AMC Subscription",
        planType: (d.amountPaid === 0 || d.isComplimentary) ? "COMPLIMENTARY" : "PAID",
        startDate: d.startDate || (d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt) || now.toISOString(),
        endDate: d.endDate || "",
        durationMonths: d.durationMonths || 12,
        amountPaid: d.amountPaid || 0,
        includedVisits: d.includedVisits ?? 2,
        usedVisits: d.visitsUsed ?? d.usedVisits ?? 0,
        status: isExpired ? "EXPIRED" : (d.status || "ACTIVE"),
        daysLeft,
        isComplimentary: d.amountPaid === 0 || d.isComplimentary || false,
        createdAt: d.createdAt || d.startDate
      });
    });

    // B. Process amc_contracts
    contractsSnap.docs.forEach((doc: any) => {
      const d = doc.data();
      const id = doc.id;
      if (seenDocIds.has(id)) return;
      seenDocIds.add(id);
      const qId = d.quoteId || d.dealId;
      if (qId && seenQuoteIds.has(qId)) return;
      if (qId) seenQuoteIds.add(qId);

      const { name, mobile, email, address } = resolveCustomer(d, qId, d.customerId, d.customerId);
      const daysLeft = getDaysLeft(d.endDate);
      const isExpired = d.endDate ? new Date(d.endDate) < now : false;

      unifiedList.push({
        id,
        source: "amc_contracts",
        customerId: d.customerId || "",
        quoteId: qId || "",
        leadId: d.leadId || "",
        customerName: name,
        customerMobile: mobile,
        customerEmail: email,
        siteAddress: address,
        planName: d.planName || "Annual Maintenance Contract",
        planType: (d.amountPaid === 0 || d.isComplimentary) ? "COMPLIMENTARY" : "PAID",
        startDate: d.startDate || (d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt) || now.toISOString(),
        endDate: d.endDate || "",
        durationMonths: d.durationMonths || 12,
        amountPaid: d.amountPaid || d.agreedPrice || 0,
        includedVisits: d.includedVisits ?? 4,
        usedVisits: d.usedVisits ?? 0,
        status: isExpired ? "EXPIRED" : (d.status || "ACTIVE"),
        daysLeft,
        isComplimentary: d.amountPaid === 0 || d.isComplimentary || false,
        createdAt: d.createdAt || d.startDate
      });
    });

    // C. Process warranties (First-Year Included with 2 Visits)
    warrantiesSnap.docs.forEach((doc: any) => {
      const d = doc.data();
      const id = doc.id;
      const qId = d.quote_id;
      
      // Skip if already tracked
      if (qId && seenQuoteIds.has(qId)) return;
      if (seenDocIds.has(id)) return;
      if (qId) seenQuoteIds.add(qId);
      seenDocIds.add(id);

      const { name, mobile, email, address } = resolveCustomer(d, qId, d.lead_id, d.firebase_uid);
      const endDate = d.expires_at || (d.updated_at?.toDate ? d.updated_at.toDate().toISOString() : "");
      const daysLeft = getDaysLeft(endDate);
      const isExpired = endDate ? new Date(endDate) < now : false;

      unifiedList.push({
        id,
        source: "warranties",
        customerId: d.lead_id || d.firebase_uid || "",
        quoteId: qId || "",
        leadId: d.lead_id || "",
        customerName: name,
        customerMobile: mobile,
        customerEmail: email,
        siteAddress: address,
        planName: "1st Year Complimentary Care (2 Visits)",
        planType: "COMPLIMENTARY",
        startDate: d.starts_at || (d.created_at?.toDate ? d.created_at.toDate().toISOString() : d.created_at) || now.toISOString(),
        endDate,
        durationMonths: d.hardware_coverage_months || 12,
        amountPaid: 0,
        includedVisits: d.total_amc_visits_allowed ?? 2,
        usedVisits: d.amc_visits_used ?? 0,
        status: isExpired ? "EXPIRED" : (d.status === "inactive" ? "INACTIVE" : "ACTIVE"),
        daysLeft,
        isComplimentary: true,
        createdAt: d.created_at || d.starts_at
      });
    });

    // Sort by startDate desc
    unifiedList.sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());

    return NextResponse.json({ success: true, data: unifiedList });
  } catch (error: any) {
    console.error("[Admin AMC Subscriptions API Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Create new AMC Contract manually
export async function POST(request: NextRequest) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "OPERATIONS"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      customerName,
      customerMobile,
      customerEmail,
      siteAddress,
      quoteId,
      planName,
      durationMonths = 12,
      includedVisits = 2,
      price = 0,
      isComplimentary = false,
      notes = ""
    } = body;

    if (!customerName || !customerMobile) {
      return NextResponse.json({ success: false, message: "Customer Name and Mobile are required" }, { status: 400 });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + Number(durationMonths || 12));

    const contractRef = adminDb.collection("amc_contracts").doc();
    const subRef = adminDb.collection("amc_subscriptions").doc(contractRef.id);

    const contractData = {
      id: contractRef.id,
      customerName,
      customerMobile,
      customerEmail: customerEmail || "",
      siteAddress: siteAddress || "",
      quoteId: quoteId || "",
      planName: planName || (price === 0 ? "1st Year Complimentary Care (2 Visits)" : "Annual Maintenance Contract"),
      durationMonths: Number(durationMonths || 12),
      includedVisits: Number(includedVisits || 2),
      usedVisits: 0,
      amountPaid: Number(price || 0),
      isComplimentary: isComplimentary || price === 0,
      status: "ACTIVE",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      notes,
      createdAt: new Date().toISOString()
    };

    // Save to both amc_contracts and amc_subscriptions for complete ecosystem compatibility
    await Promise.all([
      contractRef.set(contractData),
      subRef.set({
        ...contractData,
        customerId: customerMobile,
        visitsUsed: 0
      })
    ]);

    return NextResponse.json({ success: true, data: contractData, message: "AMC Contract created successfully" });
  } catch (error: any) {
    console.error("[Admin AMC Create Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Log visit or Renew AMC contract
export async function PATCH(request: NextRequest) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "OPERATIONS"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, source, action, renewalPrice, newPlanName } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, message: "ID and Action are required" }, { status: 400 });
    }

    const now = new Date();

    if (action === "LOG_VISIT") {
      // Increment used visits
      if (source === "warranties") {
        await adminDb.collection("warranties").doc(id).update({
          amc_visits_used: FieldValue.increment(1),
          last_visit_at: now.toISOString(),
          updated_at: now
        });
      } else if (source === "amc_contracts") {
        await adminDb.collection("amc_contracts").doc(id).update({
          usedVisits: FieldValue.increment(1),
          lastVisitAt: now.toISOString()
        });
        // also sync amc_subscriptions if exists
        try {
          await adminDb.collection("amc_subscriptions").doc(id).update({
            visitsUsed: FieldValue.increment(1)
          });
        } catch (_) {}
      } else {
        await adminDb.collection("amc_subscriptions").doc(id).update({
          visitsUsed: FieldValue.increment(1),
          usedVisits: FieldValue.increment(1),
          lastVisitAt: now.toISOString()
        });
      }

      return NextResponse.json({ success: true, message: "Maintenance visit logged successfully" });
    }

    if (action === "RENEW") {
      // Renew for 12 months
      const newEndDate = new Date();
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);

      const renewalData: any = {
        status: "ACTIVE",
        startDate: now.toISOString(),
        endDate: newEndDate.toISOString(),
        usedVisits: 0,
        visitsUsed: 0,
        amc_visits_used: 0,
        isComplimentary: false,
        renewedAt: now.toISOString()
      };

      if (renewalPrice !== undefined) {
        renewalData.amountPaid = Number(renewalPrice);
      }
      if (newPlanName) {
        renewalData.planName = newPlanName;
      }

      if (source === "warranties") {
        // Upgrade warranty to a full amc_contract on renewal!
        const wDoc = await adminDb.collection("warranties").doc(id).get();
        const wData = wDoc.data() || {};
        const contractRef = adminDb.collection("amc_contracts").doc(id);

        await contractRef.set({
          id,
          quoteId: wData.quote_id || "",
          leadId: wData.lead_id || "",
          customerName: wData.customer_name || "Valued Customer",
          customerMobile: wData.customer_phone || "",
          planName: newPlanName || "Annual Maintenance Contract (Year 2 Renewal)",
          durationMonths: 12,
          includedVisits: 4,
          usedVisits: 0,
          amountPaid: Number(renewalPrice || 2499),
          isComplimentary: false,
          status: "ACTIVE",
          startDate: now.toISOString(),
          endDate: newEndDate.toISOString(),
          createdAt: now.toISOString()
        });

        // Also update the warranty doc
        await adminDb.collection("warranties").doc(id).update({
          status: "active",
          expires_at: newEndDate.toISOString(),
          amc_visits_used: 0,
          total_amc_visits_allowed: 4,
          updated_at: now
        });
      } else if (source === "amc_contracts") {
        await adminDb.collection("amc_contracts").doc(id).update(renewalData);
        try {
          await adminDb.collection("amc_subscriptions").doc(id).update(renewalData);
        } catch (_) {}
      } else {
        await adminDb.collection("amc_subscriptions").doc(id).update(renewalData);
      }

      return NextResponse.json({ success: true, message: "AMC Contract renewed successfully for 1 Year" });
    }

    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin AMC Patch Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
