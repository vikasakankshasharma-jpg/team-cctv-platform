import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";
import { mergeAppSettings } from "@/lib/cached-settings";
import { calculatePricing } from "@/lib/pricing-engine";
import { Product, Addon } from "@/types";

export interface BaselineQuoteResult {
  quoteDoc: FirebaseFirestore.DocumentSnapshot | null;
  quoteData: any;
  leadDoc: FirebaseFirestore.DocumentSnapshot | null;
  leadData: any;
  created: boolean;
}

/**
 * Ensures an authoritative Quotation exists for a given quoteId or leadId.
 * If no quote exists or the existing quote is empty (₹0 with 0 items),
 * automatically calculates server-side baseline pricing using wizard requirements
 * and persists the quotation to Firestore under `quotes/{leadId}`.
 */
export async function getOrCreateLeadQuote(leadOrQuoteId: string): Promise<BaselineQuoteResult> {
  if (!leadOrQuoteId) {
    return { quoteDoc: null, quoteData: null, leadDoc: null, leadData: null, created: false };
  }

  // 1. Try finding quote directly in quotes collection
  let quoteDoc = await adminDb.collection("quotes").doc(leadOrQuoteId).get();
  let quoteData: any = quoteDoc.exists ? quoteDoc.data() : null;

  let leadId = quoteData?.leadId || quoteData?.lead_id || leadOrQuoteId;
  let leadDoc = await adminDb.collection("leads").doc(leadId).get();
  let leadData: any = leadDoc.exists ? leadDoc.data() : null;

  // 2. If quote not found directly by ID, check if lead specifies a quote ID
  if (!quoteData && leadData) {
    const qId = leadData.last_quote_id || leadData.latest_quote_id || leadData.won_quote_id || leadData.quote_id || leadData.quoteId;
    if (qId) {
      const linkedDoc = await adminDb.collection("quotes").doc(qId).get();
      if (linkedDoc.exists) {
        quoteDoc = linkedDoc;
        quoteData = { id: qId, ...linkedDoc.data() };
      } else {
        const subDoc = await adminDb.collection("leads").doc(leadId).collection("quotes").doc(qId).get();
        if (subDoc.exists) {
          quoteDoc = subDoc;
          quoteData = { id: qId, ...subDoc.data() };
        }
      }
    }

    if (!quoteData) {
      const qByLead = await adminDb.collection("quotes").where("leadId", "==", leadId).limit(1).get();
      if (!qByLead.empty) {
        quoteDoc = qByLead.docs[0];
        quoteData = { id: quoteDoc.id, ...quoteDoc.data() };
      } else {
        const qByLead2 = await adminDb.collection("quotes").where("lead_id", "==", leadId).limit(1).get();
        if (!qByLead2.empty) {
          quoteDoc = qByLead2.docs[0];
          quoteData = { id: quoteDoc.id, ...quoteDoc.data() };
        }
      }
    }
  }

  // 3. Check if existing quoteData is non-empty and valid
  const hasValidPricing = quoteData && (
    (quoteData.total_payable && quoteData.total_payable > 0) ||
    (quoteData.pricingSnapshot?.total_payable && quoteData.pricingSnapshot.total_payable > 0) ||
    (Array.isArray(quoteData.items) && quoteData.items.length > 0)
  );

  if (hasValidPricing) {
    return { quoteDoc, quoteData, leadDoc, leadData, created: false };
  }

  // 4. If neither exists, we cannot synthesize
  if (!leadData && !quoteData) {
    return { quoteDoc: null, quoteData: null, leadDoc: null, leadData: null, created: false };
  }

  // 5. Synthesize baseline quotation from lead wizard answers
  const answers = (leadData?.wizard_answers || quoteData?.requirementSnapshot || {}) as Record<string, any>;
  const camCount = Math.max(
    1,
    Math.min(
      64,
      Number(
        leadData?.camera_count ||
        answers.camera_count ||
        answers.q_camera_count ||
        quoteData?.camera_count ||
        4
      )
    )
  );

  const rawTech = (
    answers.technology_preference ||
    leadData?.technology_choice ||
    answers.q_technology ||
    quoteData?.technology ||
    "HD"
  );
  const tech = String(rawTech).toUpperCase() === "IP" ? "IP" : "HD";
  const recDays = Number(answers.recording_days || answers.q_storage_days || quoteData?.recording_days || 7);
  const brandPref = answers.brand_preference || "Mixed (Best Price)";
  const planType = leadData?.selectedPlan || answers.plan_type || "recommended";
  const targetLeadId = leadId || leadOrQuoteId;

  try {
    const [productsSnap, addonsSnap, settingsSnap, geoRulesSnap] = await Promise.all([
      adminDb.collection("products").where("is_active", "==", true).get(),
      adminDb.collection("addons").where("is_active", "==", true).get(),
      adminDb.collection("settings").doc(SETTINGS_DOC_ID).get(),
      adminDb.collection("geo_pricing_rules").where("is_active", "==", true).get(),
    ]);

    const products = productsSnap.docs
      .map((d) => {
        const data = d.data() as any;
        if (!Array.isArray(data.technologies)) {
          data.technologies = data.technology ? [data.technology] : ["Common"];
        }
        return { id: d.id, ...data };
      })
      .filter((p) => (p as any).is_deleted !== true) as Product[];

    const addons = addonsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Addon[];
    const geoRules = geoRulesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
    const settings = mergeAppSettings(settingsSnap.data() as any);

    const selection: any = {
      plan_type: planType,
      technology: tech,
      camera_count: camCount,
      storage_days: recDays,
      brand_preference: brandPref,
      picture_quality: "good",
      resolution_preference: "2MP",
      selected_addons: [],
    };

    const pincode = leadData?.address?.pincode || answers.lead_pincode || answers.pincode;

    const pricing = calculatePricing({
      selection,
      products,
      addons,
      settings,
      cablingDone: answers.cabling_done ?? false,
      cablingMeters: answers.total_cable_length_meters,
      site_surcharge_flags: {},
      referralDiscountPercent: 0,
      referralDiscountFlat: 0,
      geoRules,
      locationParams: { pincode },
    });

    const cleanPricing = JSON.parse(JSON.stringify(pricing));
    const items = cleanPricing.breakdown?.items || cleanPricing.items || [];

    const newQuoteData: any = {
      id: targetLeadId,
      quoteId: targetLeadId,
      lead_id: targetLeadId,
      leadId: targetLeadId,
      customer_name: leadData?.customer_name || answers.customer_name || "Valued Client",
      customer_mobile: leadData?.mobile_number || answers.customer_mobile || "",
      status: "GENERATED",
      leadStatus: leadData?.leadStatus || "NEW",
      source: leadData?.source || "wizard",
      version: 1,
      selection,
      requirementSnapshot: {
        camera_count: camCount,
        technology_preference: tech,
        recording_days: recDays,
        ...answers,
      },
      configuration_snapshot: items,
      configurationSnapshot: { items },
      items,
      pricingSnapshot: cleanPricing,
      total_payable: cleanPricing.total_payable || cleanPricing.finalPrice || 0,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Save to quotes collection
    await adminDb.collection("quotes").doc(targetLeadId).set(newQuoteData, { merge: true });

    // Update lead record
    if (leadDoc && leadDoc.exists) {
      await adminDb.collection("leads").doc(targetLeadId).update({
        last_quote_id: targetLeadId,
        latest_quote_id: targetLeadId,
        quote_id: targetLeadId,
        total_payable: newQuoteData.total_payable,
        updated_at: new Date().toISOString(),
      });
    }

    return {
      quoteDoc: null,
      quoteData: newQuoteData,
      leadDoc,
      leadData,
      created: true,
    };
  } catch (err) {
    console.error("Error generating baseline quote:", err);
    return { quoteDoc, quoteData, leadDoc, leadData, created: false };
  }
}
