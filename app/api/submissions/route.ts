import { NextRequest } from "next/server";
import { CreateLeadSchema } from "@/lib/validators";
import { adminDb, arrayUnion, serverTimestamp, increment } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
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

    // --- TERRITORY MAPPING & AUTO ASSIGNMENT ---
    const { findEligiblePartners } = await import("@/lib/territory");
    const { sendCustomerWhatsApp, sendAdminNotification } = await import("@/lib/notification-service");
    const leadAddress = { pincode, city, state, full_address: `${city} ${state} ${pincode}`, coordinates: { lat: 0, lng: 0 }, landmark1: "", landmark2: "" };
    
    // Fetch active Salespersons
    const salespersonsSnap = await adminDb.collection("salespersons").where("is_active", "==", true).get();
    const allSalespersons = salespersonsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    const eligibleSalespersons = findEligiblePartners(leadAddress, allSalespersons);
    
    // Fetch active Installers
    const installersSnap = await adminDb.collection("installers").where("is_active", "==", true).get();
    const allInstallers = installersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    const eligibleInstallers = findEligiblePartners(leadAddress, allInstallers);

    let assigned_salesperson_id: string | null = null;
    let broadcasted_to_salesperson_ids: string[] = [];
    
    if (eligibleSalespersons.length === 1) {
      assigned_salesperson_id = eligibleSalespersons[0];
      
      // Notify the Auto-Assigned Salesperson
      const spDoc = allSalespersons.find(s => s.id === assigned_salesperson_id);
      if (spDoc && spDoc.mobile_number) {
        await sendCustomerWhatsApp(
          spDoc.mobile_number,
          `🎯 *New Lead Auto-Assigned!*\nLead: ${leadData.customer_name}\nPincode: ${pincode}\nPlease check your Salesperson dashboard to assist the customer.`
        );
      }
    } else if (eligibleSalespersons.length > 1) {
      broadcasted_to_salesperson_ids = eligibleSalespersons;
    }

    let assigned_installer_id: string | null = null;
    let broadcasted_to_installer_ids: string[] = [];
    
    if (eligibleInstallers.length === 1) {
      assigned_installer_id = eligibleInstallers[0];
    } else if (eligibleInstallers.length > 1) {
      broadcasted_to_installer_ids = eligibleInstallers;
    }
    
    // --- ESCALATION CHECK ---
    let is_escalated = false;
    if (eligibleSalespersons.length === 0) {
      is_escalated = true;
      await sendAdminNotification(`⚠️ *Unmapped Territory Alert*\nNew lead (${leadData.customer_name}) generated in Pincode: ${pincode}, but no Internal Salesperson covers this area. Please dispatch manually.`);
    }

    // 4. Create Lead Document
    const newLeadRef = adminDb.collection("leads").doc();
    const isHotLead = leadData.cabling_done === true;
    
    // Dynamic SLA Timeout Logic:
    // If it's a hot lead (ready for install/cabling done), SLA is tighter (e.g. 15 mins)
    // Otherwise, SLA is more relaxed (e.g. 60 mins)
    const slaTimeoutMinutes = isHotLead ? 15 : 60;
    const slaBreachAt = new Date(Date.now() + slaTimeoutMinutes * 60 * 1000);

    await newLeadRef.set({
      customer_name:        leadData.customer_name,
      mobile_number:        leadData.mobile_number,
      firebase_uid:         leadData.firebase_uid,
      status:               leadData.status || "new",
      promoter_id:          promoterId,
      referral_code_used:   leadData.referral_code || null,
      wizard_answers:       leadData.wizard_answers,
      property_type:        leadData.property_type,
      technology_choice:    leadData.technology_choice,
      cabling_done:         leadData.cabling_done,
      is_hot_lead:          isHotLead,

      // Hub & Spoke Routing
      hub_id: null,
      
      // Auto-Assignment & Broadcast Fields
      assigned_salesperson_id,
      assigned_installer_id,
      broadcasted_to_salesperson_ids,
      broadcasted_to_installer_ids,
      
      // SLA Tracking
      sla_breach_at:         slaBreachAt,
      is_escalated:          is_escalated,

      // Expansion Tracking Fields
      detected_pincode:      pincode || null,
      detected_city:         locationData?.city ?? "Unknown",
      detected_city_slug:    locationData?.slug ?? null,
      detected_state:        "Rajasthan",
      service_status:        locationData?.served ? "active" : "waitlist",
      is_reference_quote:    locationData ? !locationData.served : false,
      waitlist_confirmed:    false,

      created_at:        serverTimestamp(),
      updated_at:        serverTimestamp(),
      follow_up_notes:   arrayUnion("Lead ingested via enterprise router (Pending Dispatch)"),
      is_deleted:        false,
    });
    
    // 5. Update Service Areas Waitlist Count (Async)
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
