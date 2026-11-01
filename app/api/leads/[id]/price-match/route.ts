import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { PriceMatchSubmitSchema } from "@/lib/validators";
import { ApiResponse } from "@/lib/api-response";
import { calculatePricing } from "@/lib/pricing-engine";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";
import { mergeAppSettings } from "@/lib/cached-settings";
import { Product, Addon, Lead } from "@/types";

/**
 * POST /api/leads/[id]/price-match
 * Customer submits a competitor quote for price matching against a selected or baseline package.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { success } = await rateLimit(request);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const { id: leadId } = await params;
    if (!leadId) return ApiResponse.badRequest("Lead ID is required");

    const body = await request.json();

    // Validate input
    const validation = PriceMatchSubmitSchema.safeParse({
      ...body,
      lead_id: leadId,
    });

    if (!validation.success) {
      return ApiResponse.badRequest(
        "Invalid price match submission",
        validation.error.format()
      );
    }

    const data = validation.data;

    // Verify the lead exists
    const leadRef = adminDb.collection("leads").doc(leadId);
    const leadDoc = await leadRef.get();
    if (!leadDoc.exists) {
      return ApiResponse.error("Lead not found", "NOT_FOUND", 404);
    }

    const leadData = leadDoc.data() as Lead;
    const answers = (leadData.wizard_answers || {}) as Record<string, any>;

    // Calculate baseline pricing from selected package or wizard answers
    let ourTargetPrice: number = data.selected_package_price || 0;
    let baselineQuoteId: string | null =
      (leadData as any).quote_id ||
      (leadData as any).latest_quote_id ||
      (leadData as any).last_quote_id ||
      (leadData as any).quoteId ||
      null;

    try {
      const camCount = Math.max(
        1,
        Math.min(
          64,
          Number(
            data.selected_camera_count ||
              answers.camera_count ||
              (leadData as any).camera_count ||
              4
          )
        )
      );
      const tech = (
        data.selected_technology ||
        answers.technology_preference ||
        leadData.technology_choice ||
        "HD"
      ).toUpperCase() === "IP"
        ? "IP"
        : "HD";
      const recDays = Number(answers.recording_days || 15);
      const brandPref = answers.brand_preference || "Mixed (Best Price)";
      const planType =
        data.selected_plan_type ||
        (leadData as any).selectedPlan ||
        answers.plan_type ||
        "recommended";

      const [productsSnap, addonsSnap, settingsSnap, geoRulesSnap] =
        await Promise.all([
          adminDb.collection("products").where("is_active", "==", true).get(),
          adminDb.collection("addons").where("is_active", "==", true).get(),
          adminDb.collection("settings").doc(SETTINGS_DOC_ID).get(),
          adminDb
            .collection("geo_pricing_rules")
            .where("is_active", "==", true)
            .get(),
        ]);

      const products = productsSnap.docs
        .map((d) => {
          const pData = d.data() as any;
          if (!Array.isArray(pData.technologies)) {
            pData.technologies = pData.technology
              ? [pData.technology]
              : ["Common"];
          }
          return { id: d.id, ...pData };
        })
        .filter((p) => (p as any).is_deleted !== true) as Product[];

      const addons = addonsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Addon[];
      const geoRules = geoRulesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as any[];
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

      const pricing = calculatePricing({
        selection,
        products,
        addons,
        settings,
        cablingDone: answers.cabling_done ?? false,
        cablingMeters: answers.total_cable_length_meters,
        geoRules,
        locationParams: {
          pincode: (leadData.address?.pincode ||
            answers.lead_pincode ||
            answers.pincode) as string | undefined,
        },
      });

      if (!ourTargetPrice || ourTargetPrice <= 0) {
        ourTargetPrice = pricing.total_payable;
      }

      // If no quote document exists, persist an authoritative quote document now!
      if (!baselineQuoteId) {
        const quoteRef = adminDb.collection("quotes").doc();
        baselineQuoteId = quoteRef.id;

        const packageTitle =
          data.selected_package_title ||
          `${camCount}-Camera ${tech} ${planType.toUpperCase()} Package`;

        await quoteRef.set({
          id: baselineQuoteId,
          leadId: leadId,
          lead_id: leadId,
          customer_name:
            leadData.customer_name || data.uploaded_by_name || "Customer",
          customer_mobile: leadData.mobile_number || "",
          total_payable: ourTargetPrice,
          original_total_payable: ourTargetPrice,
          total_system_cost: pricing.total_system_cost,
          pricing_breakdown: pricing,
          items: pricing.items || [],
          selection: {
            ...selection,
            package_title: packageTitle,
          },
          status: "draft",
          is_price_match_baseline: true,
          competitor_quote_url: data.competitor_quote_url,
          competitor_name: data.competitor_name || null,
          competitor_total: data.competitor_total || null,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
    } catch (calcError) {
      console.warn("Could not calculate baseline quote for price match:", calcError);
    }

    // Create price match request in subcollection
    const requestRef = leadRef.collection("price_match_requests").doc();
    const priceMatchDoc: Record<string, unknown> = {
      lead_id: leadId,
      uploaded_by: body.uploaded_by || "customer",
      uploaded_by_name: data.uploaded_by_name,
      competitor_name: data.competitor_name || null,
      competitor_quote_url: data.competitor_quote_url,
      competitor_total: data.competitor_total || null,
      notes: data.notes || null,
      status: "pending" as const,
      our_original_total: ourTargetPrice || null,
      selected_package_title: data.selected_package_title || null,
      selected_plan_type: data.selected_plan_type || null,
      selected_technology: data.selected_technology || null,
      selected_camera_count: data.selected_camera_count || null,
      created_at: serverTimestamp(),
    };

    await requestRef.set(priceMatchDoc);

    // Update the lead with the price match reference and quote reference
    const leadUpdates: Record<string, unknown> = {
      price_match_request_id: requestRef.id,
      price_match_status: "pending",
      competitor_quote_url: data.competitor_quote_url,
      competitor_name: data.competitor_name || null,
      competitor_total: data.competitor_total || null,
      competitor_quote_received: true,
      selected_package_title: data.selected_package_title || null,
      selected_package_price: ourTargetPrice || null,
      updated_at: serverTimestamp(),
    };

    if (baselineQuoteId) {
      leadUpdates.quote_id = baselineQuoteId;
      leadUpdates.latest_quote_id = baselineQuoteId;
      leadUpdates.last_quote_id = baselineQuoteId;
    }

    await leadRef.update(leadUpdates);

    return ApiResponse.success(
      {
        id: requestRef.id,
        ...priceMatchDoc,
        quote_id: baselineQuoteId,
        created_at: new Date().toISOString(),
      },
      201
    );
  } catch (error: any) {
    console.error("Error creating price match request:", error);
    return ApiResponse.error(
      "Internal server error",
      "INTERNAL_ERROR",
      500,
      error.message
    );
  }
}

/**
 * GET /api/leads/[id]/price-match
 * Fetch all price match requests for a lead.
 * No auth required — the lead ID serves as the access token.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { success } = await rateLimit(request);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const { id: leadId } = await params;
    if (!leadId) return ApiResponse.badRequest("Lead ID is required");

    const leadRef = adminDb.collection("leads").doc(leadId);
    const snap = await leadRef
      .collection("price_match_requests")
      .orderBy("created_at", "desc")
      .get();

    const requests = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return ApiResponse.success(requests);
  } catch (error: any) {
    console.error("Error fetching price match requests:", error);
    return ApiResponse.error(
      "Internal server error",
      "INTERNAL_ERROR",
      500,
      error.message
    );
  }
}
