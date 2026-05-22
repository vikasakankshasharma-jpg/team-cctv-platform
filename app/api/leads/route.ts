import { NextRequest } from "next/server";
import { CreateLeadSchema } from "@/lib/validators";
import { adminDb, arrayUnion, serverTimestamp, increment } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { routeLeadToFranchise, incrementFranchiseLeadCount } from "@/lib/lead-router";
import { ApiResponse } from "@/lib/api-response";
import { calculateSlaDeadline, OperatingHours } from "@/lib/sla-engine";

/**
 * ENTERPRISE LEAD INGESTION
 * Handles lead creation, referral validation, and territory-based load balancing.
 */
export async function POST(request: NextRequest) {
  const { success } = await rateLimit(request);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const body = await request.json();

    // 1. Validate request body
    const validation = CreateLeadSchema.safeParse(body);
    if (!validation.success) {
      return ApiResponse.badRequest("Lead validation failed", validation.error.format());
    }

    const leadData = validation.data;
    let promoterId: string | null = null;

    // 2. Validate referral code if provided
    if (leadData.referral_code) {
      const promotersSnapshot = await adminDb
        .collection("promoters")
        .where("referral_code", "==", leadData.referral_code)
        .where("is_active", "==", true)
        .limit(1)
        .get();

      if (!promotersSnapshot.empty) {
        promoterId = promotersSnapshot.docs[0].id;
      }
    }

    // 3. ENTERPRISE LOAD BALANCING & ROUTING
    const wizardAnswers = (leadData.wizard_answers || {}) as Record<string, unknown>;
    const pincode = String(wizardAnswers?.q_pincode || wizardAnswers?.pincode || wizardAnswers?.lead_pincode || "");
    const city    = String(wizardAnswers?.q_city    || wizardAnswers?.city    || "");
    const state   = String(wizardAnswers?.q_state   || wizardAnswers?.state   || "");

    const routing = await routeLeadToFranchise(pincode, city, state);

    // EXPANSION TRACKING: Resolve location based on pincode prefix
    const pincodePrefix = pincode.substring(0, 3);
    const PINCODE_CITY_MAP: Record<string, {city: string, slug: string, served: boolean}> = {
      "302": { city: "Jaipur",  slug: "jaipur",  served: true  },
      "303": { city: "Jaipur",  slug: "jaipur",  served: true  },
      "342": { city: "Jodhpur", slug: "jodhpur", served: false },
      "324": { city: "Kota",    slug: "kota",    served: false },
      "305": { city: "Ajmer",   slug: "ajmer",   served: false },
      "313": { city: "Udaipur", slug: "udaipur", served: false },
    };
    const locationData = PINCODE_CITY_MAP[pincodePrefix] ?? null;

    // 3.5 Calculate SLA Deadline
    let slaDeadline: string | null = null;
    if (routing.franchise_dealer_id) {
      try {
        // Fetch Admin Settings for Global SLA defaults
        const settingsDoc = await adminDb.collection("settings").doc("app_settings").get();
        const settings = settingsDoc.data();
        let opsHours = settings?.default_sla_operating_hours as OperatingHours | undefined;

        // Fetch Franchise for Local SLA overrides
        const franchiseDoc = await adminDb.collection("franchises").doc(routing.franchise_dealer_id).get();
        const franchise = franchiseDoc.data();
        
        if (franchise?.sla_operating_hours) {
          opsHours = franchise.sla_operating_hours as OperatingHours;
        }

        // Calculate SLA Deadline
        slaDeadline = calculateSlaDeadline(new Date().toISOString(), 2, opsHours);
      } catch (err) {
        console.error("Failed to calculate SLA Deadline:", err);
      }
    }

    // 4. Create Lead Document
    const newLeadRef = adminDb.collection("leads").doc();
    const isHotLead = leadData.cabling_done === true;

    await newLeadRef.set({
      customer_name:        leadData.customer_name,
      mobile_number:        leadData.mobile_number,
      firebase_uid:         leadData.firebase_uid,
      status:               "new",
      promoter_id:          promoterId,
      referral_code_used:   leadData.referral_code || null,
      wizard_answers:       leadData.wizard_answers,
      property_type:        leadData.property_type,
      technology_choice:    leadData.technology_choice,
      cabling_done:         leadData.cabling_done,
      is_hot_lead:          isHotLead,

      // Franchise load-balanced routing
      franchise_dealer_id:   routing.franchise_dealer_id,
      franchise_dealer_name: routing.franchise_dealer_name,
      franchise_match_type:  routing.match_type,

      // SLA Tracking
      sla_deadline:          slaDeadline,
      sla_breached:          false,

      // Expansion Tracking Fields
      detected_pincode:      pincode || null,
      detected_city:         locationData?.city ?? "Unknown",
      detected_city_slug:    locationData?.slug ?? null,
      detected_state:        "Rajasthan",
      service_status:        locationData?.served ? "active" : "waitlist",
      is_reference_quote:    locationData ? !locationData.served : false,
      waitlist_confirmed:    false,
      franchise_notified_at: null,

      created_at:        serverTimestamp(),
      updated_at:        serverTimestamp(),
      follow_up_notes:   arrayUnion("Lead ingested via enterprise router"),
      is_deleted:        false,
    });

    // 5. Update Franchise Counters (Async)
    if (routing.franchise_dealer_id) {
      incrementFranchiseLeadCount(routing.franchise_dealer_id).catch((err) =>
        console.error("[Leads API] Counter increment failed:", err)
      );
    }
    
    // 6. Update Service Areas Waitlist Count (Async)
    if (locationData && !locationData.served) {
      adminDb.collection("service_areas").doc(locationData.slug)
        .update({ waitlist_count: increment(1) })
        .catch(err => {
          // If doc doesn't exist, create it
          if (err.code === 5) {
            adminDb.collection("service_areas").doc(locationData.slug).set({ waitlist_count: 1 });
          }
        });
    }

    return ApiResponse.success({ 
      id: newLeadRef.id, 
      message: "Lead created and routed successfully" 
    }, 201);

  } catch (error: any) {
    console.error("Critical error in lead ingestion:", error);
    return ApiResponse.error("Internal server error", "INTERNAL_ERROR", 500, error.message);
  }
}
