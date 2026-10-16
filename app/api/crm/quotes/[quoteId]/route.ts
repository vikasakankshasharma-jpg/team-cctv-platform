import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    
    let quoteDoc = await adminDb.collection("quotes").doc(quoteId).get();
    let quoteData: any = quoteDoc.exists ? quoteDoc.data() : null;

    let leadId = quoteData?.leadId || quoteData?.lead_id || quoteId;
    let leadDoc = await adminDb.collection("leads").doc(leadId).get();
    let leadData: any = leadDoc.exists ? leadDoc.data() : null;
    
    // If quote wasn't found by ID, but we found a lead, check if the lead has a linked quote
    if (!quoteData && leadData) {
      const qId = leadData.last_quote_id || leadData.latest_quote_id || leadData.won_quote_id;
      if (qId) {
        const linkedQuoteDoc = await adminDb.collection("quotes").doc(qId).get();
        if (linkedQuoteDoc.exists) {
          quoteData = linkedQuoteDoc.data();
          quoteData.id = qId;
        } else {
          const subQuote = await adminDb.collection("leads").doc(leadId).collection("quotes").doc(qId).get();
          if (subQuote.exists) {
             quoteData = subQuote.data();
             quoteData.id = qId;
          }
        }
      }
    }

    if (!quoteData && !leadData) {
      return NextResponse.json({ success: false, message: "Lead/Quote not found" }, { status: 404 });
    }

    // Merge comprehensive lead & quote data
    const isPaid = quoteData?.status === "PAID" || quoteData?.status === "BOOKED" || leadData?.status === "PAID" || leadData?.status === "BOOKED" || leadData?.leadStatus === "WON" || quoteData?.leadStatus === "WON" || !!quoteData?.payment_id || !!quoteData?.advance_paid;
    const isSiteVisit = quoteData?.status === "site_visit" || leadData?.status === "site_visit" || !!quoteData?.site_visit_date || !!leadData?.site_visit_date;

    // --- FETCH ALL VERSIONS FOR THIS LEAD / QUOTE ---
    const versionsMap = new Map<string, any>();

    // 1. Subcollection quotes: leads/{leadId}/quotes
    try {
      const subQuotesSnap = await adminDb.collection("leads").doc(leadId).collection("quotes").get();
      subQuotesSnap.docs.forEach(doc => {
        versionsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    } catch (e) {
      console.warn("Error fetching subcollection quotes:", e);
    }

    // 2. Root collection quotes linked by lead_id or leadId
    try {
      const [qByLeadId, qByLead_id] = await Promise.all([
        adminDb.collection("quotes").where("leadId", "==", leadId).get(),
        adminDb.collection("quotes").where("lead_id", "==", leadId).get(),
      ]);
      qByLeadId.docs.forEach(doc => {
        versionsMap.set(doc.id, { id: doc.id, ...doc.data(), ...versionsMap.get(doc.id) });
      });
      qByLead_id.docs.forEach(doc => {
        versionsMap.set(doc.id, { id: doc.id, ...doc.data(), ...versionsMap.get(doc.id) });
      });
    } catch (e) {
      console.warn("Error fetching root quotes by lead:", e);
    }

    // 3. Check quote_ids array on leadData
    if (Array.isArray(leadData?.quote_ids)) {
      for (const qId of leadData.quote_ids) {
        if (!versionsMap.has(qId)) {
          try {
            const extraDoc = await adminDb.collection("quotes").doc(qId).get();
            if (extraDoc.exists) {
              versionsMap.set(qId, { id: qId, ...extraDoc.data() });
            }
          } catch (e) {}
        }
      }
    }

    // 4. Ensure current quoteData is included
    const currentActualId = quoteData?.id || quoteId;
    if (!versionsMap.has(currentActualId) && quoteData) {
      versionsMap.set(currentActualId, { id: currentActualId, ...quoteData });
    }

    // Sort versions chronologically / by version number
    const rawVersions = Array.from(versionsMap.values());
    rawVersions.sort((a, b) => {
      const vA = a.version || 1;
      const vB = b.version || 1;
      if (vA !== vB) return vA - vB;
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return dateA - dateB;
    });

    const latestQuoteId = leadData?.latest_quote_id || leadData?.last_quote_id || quoteId;

    const formattedVersions = rawVersions.map((v, index) => {
      const versionNum = v.version || (index + 1);
      const prevVersion = index > 0 ? rawVersions[index - 1] : null;
      
      const payable = v.total_payable || v.pricingSnapshot?.total_payable || v.pricingSnapshot?.finalPrice || v.finalPrice || 0;
      const prevPayable = prevVersion ? (prevVersion.total_payable || prevVersion.pricingSnapshot?.total_payable || prevVersion.pricingSnapshot?.finalPrice || prevVersion.finalPrice || 0) : 0;
      const delta = prevVersion ? (payable - prevPayable) : 0;

      const items = v.configuration_snapshot || v.pricingSnapshot?.items || v.items || [];
      const camCount = v.requirementSnapshot?.camera_count || v.selection?.camera_count || v.camera_count || (items.length > 0 ? items.find((i: any) => i.category?.includes("camera"))?.qty : null);
      
      return {
        id: v.id,
        version: versionNum,
        total_payable: payable,
        price_delta: delta,
        status: v.status || "GENERATED",
        created_at: v.created_at || v.createdAt || v.generatedAt || new Date().toISOString(),
        is_active: v.id === latestQuoteId || index === rawVersions.length - 1,
        revised_by: v.revised_by || (versionNum === 1 ? { role: "system", name: "Initial Generation" } : { role: "admin", name: "Admin Team" }),
        revision_notes: v.revision_notes || (versionNum === 1 ? "Initial quotation baseline" : "Revision updated by team"),
        camera_count: camCount,
        technology: v.technology || v.requirementSnapshot?.technology_preference || "HD",
        recording_days: v.requirementSnapshot?.recording_days || v.selection?.storage_days || 15,
        items_count: items.length,
        surcharges: v.site_surcharge_flags || {},
        items_snapshot: items.slice(0, 6).map((it: any) => ({
          name: it.name || it.display_name || "Hardware Item",
          qty: it.qty || it.quantity || 1,
          price: it.price || it.sellingPriceExTax || it.unit_price || 0
        }))
      };
    });

    const activeQuotePayable = quoteData?.pricingSnapshot?.finalPrice || quoteData?.pricingSnapshot?.total_payable || quoteData?.total_payable || leadData?.pricingSnapshot?.finalPrice || leadData?.total_payable || 0;
    const currentVersionNum = quoteData?.version || (formattedVersions.length > 0 ? formattedVersions[formattedVersions.length - 1].version : 1);

    const mergedData = {
      id: quoteId,
      quoteId: quoteData?.id || quoteId,
      leadId: leadId,
      customer_name: quoteData?.customer_name || leadData?.customer_name || quoteData?.billing_details?.contact_name || "Unknown Customer",
      customer_mobile: quoteData?.customer_mobile || leadData?.mobile_number || "",
      source: quoteData?.source || leadData?.source || "wizard",
      status: quoteData?.status || leadData?.status || "GENERATED",
      leadStatus: quoteData?.leadStatus || (isPaid ? "WON" : isSiteVisit ? "SITE_VISIT" : "NEW"),
      isPaid,
      isCompleted: isPaid || quoteData?.leadStatus === "WON" || leadData?.leadStatus === "WON",
      currentVersion: currentVersionNum,
      versions: formattedVersions,
      
      // Commercial & Pricing Snapshot
      pricingSnapshot: (() => {
        const pSnap = quoteData?.pricingSnapshot || leadData?.pricingSnapshot;
        if (pSnap && (pSnap.total_payable > 0 || pSnap.finalPrice > 0)) {
          return pSnap;
        }
        return {
          total_payable: activeQuotePayable,
          finalPrice: activeQuotePayable
        };
      })(),
      requirementSnapshot: quoteData?.requirementSnapshot || leadData?.wizard_answers || {},
      
      // Billing Details (merged)
      billing_details: quoteData?.billing_details || leadData?.billing_details || null,
      
      // Site Visit Details
      site_visit_date: quoteData?.site_visit_date || leadData?.site_visit_date || null,
      site_visit_slot: quoteData?.site_visit_slot || leadData?.site_visit_slot || null,
      special_notes: quoteData?.special_notes || leadData?.special_notes || "",
      address: quoteData?.address || leadData?.address || null,
      
      // Intelligence & CRM
      intentScore: quoteData?.intentScore || (isPaid ? "Hot" : isSiteVisit ? "Warm" : "Cold"),
      probabilityPercent: quoteData?.probabilityPercent || (isPaid ? 100 : isSiteVisit ? 75 : 25),
      expectedValue: quoteData?.expectedValue || leadData?.expectedValue || activeQuotePayable || 0,
      nextActionDate: quoteData?.nextActionDate || quoteData?.followUpDate || quoteData?.site_visit_date || null,
      nextActionType: quoteData?.nextActionType || (isSiteVisit ? "Site Visit" : "Follow-up"),
      follow_ups: quoteData?.follow_ups || [],
      
      createdAt: quoteData?.createdAt || quoteData?.created_at || leadData?.created_at || new Date().toISOString()
    };
    
    return NextResponse.json({ success: true, data: mergedData });
  } catch (error: any) {
    console.error("Error fetching lead:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const body = await request.json();
    
    const allowedUpdates = [
      "leadStatus", 
      "assignedTo", 
      "intentScore", 
      "installationType", 
      "expectedClosingDate", 
      "probabilityPercent", 
      "expectedValue", 
      "nextActionDate", 
      "nextActionType",
      "billing_details",
      "site_visit_date",
      "site_visit_slot",
      "special_notes",
      "address"
    ];
    const updates: any = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }
    
    if (Object.keys(updates).length > 0) {
      const quoteRef = adminDb.collection("quotes").doc(quoteId);
      const quoteDoc = await quoteRef.get();
      if (quoteDoc.exists) {
        await quoteRef.update(updates);
        const qData = quoteDoc.data();
        if (qData?.leadId || qData?.lead_id) {
          const leadRef = adminDb.collection("leads").doc(qData.leadId || qData.lead_id);
          const leadDoc = await leadRef.get();
          if (leadDoc.exists) {
            await leadRef.update(updates);
          }
        }
      } else {
        const leadRef = adminDb.collection("leads").doc(quoteId);
        const leadDoc = await leadRef.get();
        if (leadDoc.exists) {
          await leadRef.update(updates);
        }
      }
    }
    
    return NextResponse.json({ success: true, message: "Updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const url = new URL(request.url);
    const permanent = url.searchParams.get("permanent") === "true";

    let quoteDoc = await adminDb.collection("quotes").doc(quoteId).get();
    let quoteData: any = quoteDoc.exists ? quoteDoc.data() : null;

    let leadId = quoteData?.leadId || quoteData?.lead_id || quoteId;
    let leadDoc = await adminDb.collection("leads").doc(leadId).get();
    let leadData: any = leadDoc.exists ? leadDoc.data() : null;

    if (!quoteDoc.exists && !leadDoc.exists) {
      return NextResponse.json({ success: false, message: "Quote or lead not found" }, { status: 404 });
    }

    // STRICT INVARIANT: Completed / paid quotations cannot be deleted!
    const isPaid = quoteData?.status === "PAID" || quoteData?.status === "BOOKED" || quoteData?.leadStatus === "WON" || leadData?.status === "WON" || leadData?.status === "PAID" || leadData?.status === "BOOKED" || !!quoteData?.isPaid || !!leadData?.isPaid;

    if (isPaid) {
      return NextResponse.json({
        success: false,
        message: "Completed and paid quotations are legally locked and cannot be deleted. Completed quotes must be preserved for tax, invoice, and warranty audit trails. You can create a revision instead."
      }, { status: 400 });
    }

    if (permanent) {
      // Hard delete
      const batch = adminDb.batch();
      if (quoteDoc.exists) batch.delete(quoteDoc.ref);
      if (leadDoc.exists) batch.delete(leadDoc.ref);
      await batch.commit();
      return NextResponse.json({ success: true, message: "Uncompleted quotation permanently deleted." });
    } else {
      // Soft delete / Archive
      const updateData = {
        is_deleted: true,
        status: "ARCHIVED",
        leadStatus: "ARCHIVED",
        archived_at: new Date().toISOString(),
      };
      const batch = adminDb.batch();
      if (quoteDoc.exists) batch.update(quoteDoc.ref, updateData);
      if (leadDoc.exists) batch.update(leadDoc.ref, updateData);
      await batch.commit();
      return NextResponse.json({ success: true, message: "Uncompleted quotation moved to archive." });
    }
  } catch (error: any) {
    console.error("Delete quote error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
