"use server";

import { adminDb, arrayUnion, serverTimestamp, increment } from "@/lib/firebase-admin";
import { CreateLeadSchema } from "@/lib/validators";
import { calculateSlaDeadline } from "@/lib/sla-engine";

export async function createLeadAction(payload: {
  customer_name: string;
  mobile_number: string;
  firebase_uid: string;
  wizard_answers: Record<string, unknown>;
  property_type: string;
  technology_choice: string;
  cabling_done: boolean;
  camera_count?: number;
  email?: string;
  status?: string;
  source?: string;
  detected_city?: string;
  // B2B / Corporate fields
  is_b2b?: boolean;
  company_name?: string | null;
  gst_number?: string | null;
}) {
  try {
    // Validate
    const validation = CreateLeadSchema.safeParse(payload);
    if (!validation.success) {
      return { error: "Lead validation failed", details: validation.error.format() };
    }

    const leadData = validation.data;

    // Territory routing
    const { findEligiblePartners } = await import("@/lib/territory");
    const { sendCustomerWhatsApp, sendAdminNotification } = await import("@/lib/notification-service");

    const wizardAnswers = (leadData.wizard_answers || {}) as Record<string, unknown>;
    const pincode = String(wizardAnswers?.q_pincode || wizardAnswers?.pincode || wizardAnswers?.lead_pincode || "");
    const city    = String(wizardAnswers?.q_city    || wizardAnswers?.city    || payload.detected_city || "");
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

    const mockAddress = { pincode, city, state, full_address: `${city} ${state} ${pincode}`, coordinates: { lat: 0, lng: 0 }, landmark1: "", landmark2: "" };

    const salespersonsSnap = await adminDb.collection("salespersons").where("is_active", "==", true).get();
    const allSalespersons = salespersonsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    const eligibleSalespersons = findEligiblePartners(mockAddress, allSalespersons);

    const installersSnap = await adminDb.collection("installers").where("is_active", "==", true).get();
    const allInstallers = installersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    const eligibleInstallers = findEligiblePartners(mockAddress, allInstallers);

    let assigned_salesperson_id: string | null = null;
    let broadcasted_to_salesperson_ids: string[] = [];

    if (eligibleSalespersons.length === 1) {
      assigned_salesperson_id = eligibleSalespersons[0];
      const spDoc = allSalespersons.find((s: any) => s.id === assigned_salesperson_id);
      if (spDoc?.mobile_number) {
        await sendCustomerWhatsApp(spDoc.mobile_number, `🎯 *New Lead!*\nCustomer: ${leadData.customer_name}\nPincode: ${pincode}`);
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

    let is_escalated = false;
    if (eligibleSalespersons.length === 0) {
      is_escalated = true;
      await sendAdminNotification(`⚠️ *Unmapped Territory*\nLead: ${leadData.customer_name}, Pincode: ${pincode}`);
    }

    const newLeadRef = adminDb.collection("leads").doc();
    const isHotLead = leadData.cabling_done === true;
    const slaTimeoutMinutes = isHotLead ? 15 : 60;
    const slaBreachAt = new Date(Date.now() + slaTimeoutMinutes * 60 * 1000);

    // Normalize technology_choice: wizard may send "Analog" but pricing engine needs "HD"
    const rawTechChoice = leadData.technology_choice || "IP";
    const normalizedTechChoice =
      ["Analog", "analog", "hd", "HD", "TVI", "CVI", "AHD"].includes(rawTechChoice) ? "HD"
      : ["WiFi", "wifi", "Wireless", "wireless"].includes(rawTechChoice) ? "Wireless"
      : rawTechChoice.toUpperCase() === "IP" ? "IP"
      : "IP";

    await newLeadRef.set({
      customer_name:        leadData.customer_name,
      mobile_number:        leadData.mobile_number,
      firebase_uid:         leadData.firebase_uid,
      status:               leadData.status || "new",
      promoter_id:          null,
      referral_code_used:   null,
      wizard_answers:       leadData.wizard_answers,
      property_type:        leadData.property_type,
      technology_choice:    normalizedTechChoice,
      cabling_done:         leadData.cabling_done,
      camera_count:         payload.camera_count || 0,
      is_hot_lead:          isHotLead,
      // B2B / Corporate tagging
      is_b2b:               payload.is_b2b || (payload.camera_count || 0) > 16,
      company_name:         payload.company_name || null,
      gst_number:           payload.gst_number || null,
      hub_id:               null,
      assigned_salesperson_id,
      assigned_installer_id,
      broadcasted_to_salesperson_ids,
      broadcasted_to_installer_ids,
      sla_breach_at:         slaBreachAt,
      is_escalated,
      detected_pincode:      pincode || null,
      detected_city:         (locationData?.city ?? city) || "Unknown",
      detected_city_slug:    locationData?.slug ?? null,
      detected_state:        "Rajasthan",
      service_status:        locationData?.served ? "active" : "waitlist",
      is_reference_quote:    locationData ? !locationData.served : false,
      waitlist_confirmed:    false,
      source:                payload.source || "wizard",
      created_at:            serverTimestamp(),
      updated_at:            serverTimestamp(),
      follow_up_notes:       arrayUnion("Lead ingested via wizard"),
      is_deleted:            false,
    });

    if (locationData && !locationData.served) {
      adminDb.collection("service_areas").doc(locationData.slug)
        .update({ waitlist_count: increment(1) })
        .catch((err: any) => {
          if (err.code === 5) {
            adminDb.collection("service_areas").doc(locationData.slug).set({ waitlist_count: 1 });
          }
        });
    }

    return { success: true, id: newLeadRef.id };
  } catch (error: any) {
    console.error("createLeadAction error:", error);
    return { error: error.message || "Internal server error" };
  }
}
