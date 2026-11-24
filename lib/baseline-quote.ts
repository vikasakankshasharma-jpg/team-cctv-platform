import { adminDb } from "@/lib/firebase-admin";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";
import { mergeAppSettings, getCachedAdminSettings } from "@/lib/cached-settings";
import { getCachedProducts, getCachedAddons, getCachedGeoRules } from "@/lib/cached-catalog";
import { calculatePricing } from "@/lib/pricing-engine";
import { Product, Addon } from "@/types";

export interface BaselineQuoteResult {
  quoteDoc: FirebaseFirestore.DocumentSnapshot | null;
  quoteData: any;
  leadDoc: FirebaseFirestore.DocumentSnapshot | null;
  leadData: any;
  created: boolean;
}

// In-memory catalog cache to prevent quota exhaustion
let catalogCache: {
  products: Product[];
  addons: Addon[];
  settings: any;
  geoRules: any[];
  timestamp: number;
} | null = null;

export async function getBaselineCatalogData() {
  const now = Date.now();
  if (catalogCache && now - catalogCache.timestamp < 15 * 60 * 1000 && catalogCache.products.length > 0) {
    return catalogCache;
  }

  try {
    const [products, addons, settings, geoRules] = await Promise.all([
      getCachedProducts(),
      getCachedAddons(),
      getCachedAdminSettings(),
      getCachedGeoRules(),
    ]);

    if (products.length > 0) {
      catalogCache = { products, addons, settings, geoRules, timestamp: now };
      return catalogCache;
    }
  } catch (err) {
    console.warn("⚠️ Failed to load catalog from Firestore, falling back to local snapshot:", err);
  }

  // Fallback to local db_dump.json products if available
  let fallbackProducts: Product[] = [];
  try {
    const fs = await import("fs");
    const path = await import("path");
    const dumpPath = path.resolve(process.cwd(), "db_dump.json");
    if (fs.existsSync(dumpPath)) {
      const dump = JSON.parse(fs.readFileSync(dumpPath, "utf8"));
      if (Array.isArray(dump.products) && dump.products.length > 0) {
        fallbackProducts = dump.products.map((p: any) => ({
          id: p.id,
          ...p,
          technologies: Array.isArray(p.technologies) ? p.technologies : [p.technology || "Common"],
        }));
      }
    }
  } catch (_) {}

  catalogCache = {
    products: fallbackProducts,
    addons: [],
    settings: mergeAppSettings(null),
    geoRules: [],
    timestamp: now,
  };
  return catalogCache;
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
  let quoteDoc: any = null;
  let quoteData: any = null;
  try {
    quoteDoc = await adminDb.collection("quotes").doc(leadOrQuoteId).get();
    quoteData = quoteDoc.exists ? quoteDoc.data() : null;
  } catch (_) {}

  let leadId = quoteData?.leadId || quoteData?.lead_id || leadOrQuoteId;
  let leadDoc: any = null;
  let leadData: any = null;
  try {
    leadDoc = await adminDb.collection("leads").doc(leadId).get();
    leadData = leadDoc.exists ? leadDoc.data() : null;
  } catch (_) {}

  // 2. If quote not found directly by ID, check if lead specifies a quote ID
  if (!quoteData && leadData) {
    const qId = leadData.last_quote_id || leadData.latest_quote_id || leadData.won_quote_id || leadData.quote_id || leadData.quoteId;
    if (qId) {
      try {
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
      } catch (_) {}
    }

    if (!quoteData) {
      try {
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
      } catch (_) {}
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
        answers.q_cam_count ||
        quoteData?.camera_count ||
        4
      )
    )
  );

  const rawTech = (
    answers.technology_preference ||
    leadData?.technology_choice ||
    answers.q_technology ||
    answers.q_tech ||
    quoteData?.technology ||
    "HD"
  );
  const tech = String(rawTech).toUpperCase() === "IP" ? "IP" : "HD";
  const recDays = Number(answers.recording_days || answers.q_storage_days || answers.q_storage || quoteData?.recording_days || 7);
  const brandPref = answers.brand_preference || answers.q_brand || "Mixed (Best Price)";
  const planType = leadData?.selectedPlan || answers.plan_type || "recommended";
  const targetLeadId = leadId || leadOrQuoteId;

  try {
    const { products, addons, settings, geoRules } = await getBaselineCatalogData();

    const outCount = answers.outdoor_camera_count !== undefined 
      ? Number(answers.outdoor_camera_count) 
      : (answers.outdoor_bullets !== undefined ? Number(answers.outdoor_bullets) : undefined);
    const inCount = answers.indoor_camera_count !== undefined 
      ? Number(answers.indoor_camera_count) 
      : (answers.indoor_domes !== undefined ? Number(answers.indoor_domes) : undefined);
    const wifiCount = Number(answers.wifi_camera_count || 0);

    const selection: any = {
      plan_type: planType,
      technology: tech,
      camera_count: camCount,
      outdoor_camera_count: outCount,
      indoor_camera_count: inCount,
      wifi_camera_count: wifiCount > 0 ? wifiCount : undefined,
      mixed_camera_requirements: answers.mixed_camera_requirements,
      cabling_done: answers.cabling_done ?? leadData?.cabling_done ?? false,
      existing_cabling: answers.existing_cabling || answers.existing_cabling_type || leadData?.existing_cabling,
      storage_days: recDays,
      brand_preference: brandPref,
      picture_quality: answers.picture_quality || "good",
      resolution_preference: answers.resolution_preference || answers.q_resolution || "2MP",
      sensor_preference: answers.sensor_preference || (answers.features?.color ? "colorvu" : "standard_ir"),
      requested_features: answers.requested_features || (outCount && outCount > 0 ? ["bullet", "outdoor"] : []),
      selected_addons: answers.selected_addons || [],
      existing_recorder_channels: answers.existing_recorder_channels || answers.existing_channels,
      existing_working_cameras: answers.existing_working_cameras || answers.working_cameras,
      retain_existing_storage: answers.retain_existing_storage ?? false,
    };

    const pincode = leadData?.address?.pincode || leadData?.detected_pincode || answers.lead_pincode || answers.pincode;

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

    // Attempt to persist to quotes collection (silent catch on quota exhaustion)
    try {
      await adminDb.collection("quotes").doc(targetLeadId).set(newQuoteData, { merge: true });
    } catch (_) {}

    // Attempt to update lead record (silent catch on quota exhaustion)
    if (leadDoc && leadDoc.exists) {
      try {
        await adminDb.collection("leads").doc(targetLeadId).update({
          last_quote_id: targetLeadId,
          latest_quote_id: targetLeadId,
          quote_id: targetLeadId,
          total_payable: newQuoteData.total_payable,
          updated_at: new Date().toISOString(),
        });
      } catch (_) {}
    }

    return {
      quoteDoc: null,
      quoteData: newQuoteData,
      leadDoc,
      leadData,
      created: true,
    };
  } catch (err) {
    console.error("Error synthesizing baseline quote:", err);
    return { quoteDoc, quoteData, leadDoc, leadData, created: false };
  }
}
