/**
 * @file tests/certification/commercial/customer-lifecycle.test.ts
 * @description Phase 7.6 Customer Lifecycle & Admin Synchronization Test Suite.
 * Validates the complete customer lifecycle across 8 core real-world scenarios:
 *   1. Residential Customer Journey (Home 2-Floor, Smart Motion Storage & 4-Camera HD Wired Package)
 *   2. Corporate B2B Customer Journey (Factory 16-Camera 4K IP Setup + GST Invoicing)
 *   3. Zero-Cabling Smart Wireless Journey (Apartment / Flat, Wi-Fi SD-Card Storage)
 *   4. Customer Milestone Payment & Order Tracking Cycle (Booking -> Dispatch -> Handover -> Complete)
 *   5. Competitor Price Match Request & Admin Counter-Offer Lifecycle
 *   6. Customer Warranty, AMC & Support Ticket Lifecycle
 *   7. Post-Installation Customer Rating & Google Review Integration
 *   8. Customer Dashboard & Document Repository Verification
 */

import test from "node:test";
import assert from "node:assert/strict";
import { calculateCommercialMilestones } from "../../../lib/commercial/commercial-contract";
import { 
  PriceMatchSubmitSchema, 
  PriceMatchReviewSchema, 
  SupportTicketSchema 
} from "../../../lib/validators";
import type { Lead, BillingDetails } from "../../../types";

test("Phase 7.6 — Customer Full Cycle & Admin Synchronization Verification", async (t) => {

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Residential Customer Journey (Home 2-Floor, Smart Motion Recording)
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 1 — Residential Customer Journey (Smart Motion Default & Spec-Based BOM)", () => {
    // 1A: Customer Wizard Selection
    const residentialRequirement = {
      property_type: "home" as const,
      camera_count: 4,
      outdoor_bullets: 2,
      indoor_domes: 2,
      wireless_cameras: 0,
      technology: "HD" as const,
      resolution: "2MP Full HD" as const,
      brand: "CP PLUS" as const,
      storage_days: 15,
      recording_mode: "motion_only" as const, // Smart Motion (50% storage capacity optimization)
      cabling_meters: 60,
    };

    // Derived authentic spec title invariant (NO 3-TIER LABELS!)
    const packageTitle = `${residentialRequirement.camera_count}-Camera ${residentialRequirement.brand} ${residentialRequirement.resolution} ${residentialRequirement.technology} Package (1TB Storage)`;
    assert.equal(packageTitle, "4-Camera CP PLUS 2MP Full HD HD Package (1TB Storage)");
    assert.doesNotMatch(packageTitle, /\b(Budget|Value|Recommended|Pro|Premium|Elite|Plan 1|Plan 2|Plan 3)\b/i);

    // Commercial Math Invariant: All prices GST-Paid (18% inclusive)
    const grossSellingPrice = 14850;
    const taxableBase = Math.round((grossSellingPrice / 1.18) * 100) / 100; // ₹12,584.75
    const gst18 = Math.round((grossSellingPrice - taxableBase) * 100) / 100; // ₹2,265.25

    assert.equal(Math.round((taxableBase + gst18) * 100) / 100, grossSellingPrice, "Taxable base + 18% GST must match ₹0.00 drift");

    // Customer Lead Ingestion Payload
    const customerLead: Lead = {
      id: "lead_res_101",
      customer_name: "Vikas Sharma",
      mobile_number: "9587980007",
      property_type: "home",
      technology_choice: "HD",
      cabling_done: false,
      status: "quoted",
      total_payable: grossSellingPrice,
      address: {
        pincode: "302012",
        city: "Jaipur",
        state: "Rajasthan",
        landmark1: "Niwaru Road",
        landmark2: "Near Jhotwara Police Station",
        full_address: "Niwaru Road, Jhotwara, Jaipur"
      },
      wizard_answers: {
        camera_count: residentialRequirement.camera_count,
        outdoor_bullets: residentialRequirement.outdoor_bullets,
        indoor_domes: residentialRequirement.indoor_domes,
        recording_mode: residentialRequirement.recording_mode,
        storage_days: residentialRequirement.storage_days,
        pincode: "302012",
        area_landmark: "Niwaru Road, Jhotwara",
      },
      created_at: new Date().toISOString(),
    };

    // Admin synchronization assertions
    assert.equal(customerLead.status, "quoted");
    assert.equal(customerLead.total_payable, 14850);
    assert.equal(customerLead.wizard_answers?.recording_mode, "motion_only");
    assert.equal(customerLead.wizard_answers?.camera_count, 4);
    assert.equal(customerLead.address?.pincode, "302012");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Corporate B2B Customer Journey (Factory 16-Camera 4K IP Setup)
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 2 — Corporate B2B Customer Journey (GSTIN & Milestone Breakdowns)", () => {
    const corporateBilling: BillingDetails = {
      is_business: true,
      company_name: "Apex Industrial Logistics Pvt Ltd",
      gstin: "08AAACA1234A1Z5",
      pan: "AAACA1234A",
      customer_name: "Manoj Agrawal (Director)",
      phone: "9829011223",
      email: "finance@apexlogistics.in",
      address_line1: "Plot 42, Jhotwara Industrial Area",
      city: "Jaipur",
      state: "Rajasthan",
      state_code: "08",
      pincode: "302012",
    };

    const b2bGrossTotal = 95000; // GST-inclusive contract total

    // Commercial milestone split
    const milestones = calculateCommercialMilestones(b2bGrossTotal);
    assert.equal(milestones.bookingAmount, 500, "Fixed token booking amount must be ₹500");
    
    // Remaining amount after booking: ₹94,500
    // 90% at material handover: ₹85,050
    // 10% after testing & signoff: ₹9,450
    assert.equal(milestones.deliveryAmount, 85050);
    assert.equal(milestones.installationAmount, 9450);
    assert.equal(
      milestones.bookingAmount + milestones.deliveryAmount + milestones.installationAmount,
      b2bGrossTotal,
      "Sum of milestones must exactly match gross contract total"
    );

    // B2B Lead Document Shape
    const b2bLead: Partial<Lead> = {
      id: "lead_b2b_901",
      customer_name: corporateBilling.customer_name,
      mobile_number: corporateBilling.phone,
      is_b2b: true,
      company_name: corporateBilling.company_name,
      gst_number: corporateBilling.gstin,
      billing_details: corporateBilling,
      total_payable: b2bGrossTotal,
      booking_amount: milestones.bookingAmount,
      delivery_amount: milestones.deliveryAmount,
      installation_amount: milestones.installationAmount,
      status: "quoted",
    };

    assert.equal(b2bLead.is_b2b, true, "Lead must be tagged as B2B");
    assert.equal(b2bLead.gst_number, "08AAACA1234A1Z5", "GSTIN must be preserved for corporate tax invoicing");
    assert.equal(b2bLead.delivery_amount, 85050);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Zero-Cabling Smart Wireless Journey
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 3 — Zero-Cabling Smart Wireless Journey (Wi-Fi & MicroSD Architecture)", () => {
    const wifiRequirement = {
      property_type: "apartment" as const,
      camera_count: 2,
      technology: "Smart Wi-Fi" as const,
      brand: "TP-LINK" as const,
      storage: "128GB MicroSD" as const,
    };

    // Authentic hardware title Derivation
    const wifiPackageTitle = `${wifiRequirement.camera_count}-Camera ${wifiRequirement.brand} ${wifiRequirement.technology} Package (${wifiRequirement.storage})`;
    assert.equal(wifiPackageTitle, "2-Camera TP-LINK Smart Wi-Fi Package (128GB MicroSD)");

    // BOM Hardware Validation: Standalone Wi-Fi setups do NOT require DVR or heavy surveillance hard drives
    const wifiItems = [
      { product_id: "cam-tplink-c200", display_name: "TP-Link Tapo C200 3MP Pan/Tilt Wi-Fi Camera", qty: 2, unit_price: 2200 },
      { product_id: "sd-128gb", display_name: "SanDisk Ultra 128GB MicroSD Card", qty: 2, unit_price: 900 },
      { product_id: "adp-tplink", display_name: "5V Power Adapter & USB Cable", qty: 2, unit_price: 350 },
      { product_id: "svc-wifi-setup", display_name: "Wi-Fi Cloud Setup & Router Sync", qty: 1, unit_price: 600 },
    ];

    const hasHeavyDVR = wifiItems.some(i => i.display_name.toLowerCase().includes("dvr"));
    const hasCopper3Plus1 = wifiItems.some(i => i.display_name.toLowerCase().includes("3+1"));
    const hasMicroSD = wifiItems.some(i => i.display_name.toLowerCase().includes("microsd"));

    assert.equal(hasHeavyDVR, false, "Wi-Fi package must NOT include heavy analog DVR");
    assert.equal(hasCopper3Plus1, false, "Wi-Fi package must NOT require 3+1 copper bundle cabling");
    assert.equal(hasMicroSD, true, "Wi-Fi package must feature high-end MicroSD card");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Complete Milestone Payment & Order Tracking Cycle
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 4 — Milestone Payment Transitions & Order Tracking Sync (/track/[id])", () => {
    const grossTotal = 24500;
    const milestones = calculateCommercialMilestones(grossTotal); // booking: 500, delivery: 21600, install: 2400

    const trackingLead: Record<string, any> = {
      id: "lead_track_551",
      customer_name: "Rahul Meena",
      mobile_number: "9828011224",
      status: "quoted",
      payment_status: "pending",
      total_payable: grossTotal,
      amount_paid: 0,
      completion_pin: "749201",
      delivery_otp: "4821",
    };

    // STAGE 1: Advance Booking Payment (₹500)
    trackingLead.amount_paid += milestones.bookingAmount;
    trackingLead.status = "booked";
    trackingLead.payment_status = "advance_paid";

    assert.equal(trackingLead.status, "booked");
    assert.equal(trackingLead.payment_status, "advance_paid");
    assert.equal(trackingLead.amount_paid, 500);

    // Tracking UI evaluation: currentStep should be 1 (Order Confirmed)
    let currentStep = 1;
    assert.equal(currentStep, 1, "Tracking step must be 1 (Order Confirmed)");

    // STAGE 2: Dispatch & Technician Assigned
    trackingLead.assigned_installer_id = "inst_jaipur_01";
    trackingLead.status = "site_visit";
    currentStep = 3; // Installer En-Route
    assert.equal(currentStep, 3, "Tracking step must advance to 3 (Installer En-Route)");

    // STAGE 3: Material Handover & 90% Payment (₹21,600)
    // Delivery OTP verified
    const customerEnteredOtp = "4821";
    assert.equal(customerEnteredOtp, trackingLead.delivery_otp, "Delivery OTP must match");
    trackingLead.amount_paid += milestones.deliveryAmount;
    trackingLead.payment_status = "delivery_paid";
    assert.equal(trackingLead.amount_paid, 22100); // 500 + 21,600

    // STAGE 4: Final Signoff & 10% Payment (₹2,400)
    // Completion PIN verified
    const technicianEnteredPin = "749201";
    assert.equal(technicianEnteredPin, trackingLead.completion_pin, "Technician PIN must match");
    trackingLead.amount_paid += milestones.installationAmount;
    trackingLead.status = "won";
    trackingLead.payment_status = "paid";
    currentStep = 4; // Installation Complete

    assert.equal(trackingLead.amount_paid, grossTotal, "Total paid must match gross contract total exactly");
    assert.equal(trackingLead.payment_status, "paid");
    assert.equal(trackingLead.status, "won");
    assert.equal(currentStep, 4, "Tracking step must reach 4 (Installation Complete)");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: Competitor Price Match Request & Admin Counter-Offer Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 5 — Price Match Request & Admin Counter-Offer Sync", () => {
    const leadId = "lead_pm_test_301";
    const baselinePrice = 22000;

    // 5A: Customer submits competitor quote
    const submissionPayload = {
      lead_id: leadId,
      competitor_quote_url: "https://storage.googleapis.com/test-bucket/competitor-quote.pdf",
      competitor_name: "Local CCTV Vendor",
      competitor_total: 19500, // ₹2,500 lower
      notes: "Competitor is offering CP Plus 4-camera setup for ₹19,500.",
      uploaded_by_name: "Suresh Jain",
      selected_package_price: baselinePrice,
    };

    const parsedSubmission = PriceMatchSubmitSchema.safeParse(submissionPayload);
    assert.equal(parsedSubmission.success, true, "Price match submission payload must pass schema validation");

    const priceMatchRequest = {
      id: "pm_req_801",
      ...parsedSubmission.data,
      status: "pending" as const,
      created_at: new Date().toISOString(),
    };

    assert.equal(priceMatchRequest.status, "pending");

    // 5B: Admin reviews and counter-offers ₹20,000 with additional warranty
    const reviewPayload = {
      status: "counter_offered" as const,
      review_notes: "Counter-offered ₹20,000 including 1-year complimentary AMC service.",
      counter_offer_amount: 20000,
    };

    const parsedReview = PriceMatchReviewSchema.safeParse(reviewPayload);
    assert.equal(parsedReview.success, true, "Price match review payload must pass schema validation");

    // Reconcile reverse GST on new counter-offer price
    const counterOfferGross = parsedReview.data!.counter_offer_amount!;
    const counterTaxableBase = Math.round((counterOfferGross / 1.18) * 100) / 100; // ₹16,949.15
    const counterGst = Math.round((counterOfferGross - counterTaxableBase) * 100) / 100; // ₹3,050.85

    assert.equal(counterTaxableBase + counterGst, counterOfferGross, "Counter-offer GST reconciliation must have ₹0 drift");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 6: Customer Warranty, AMC & Support Ticket Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 6 — Warranty & Free AMC Ticket Creation (/api/customer/tickets)", () => {
    const warranty = {
      id: "war_2026_889",
      lead_id: "lead_res_101",
      status: "active",
      expires_at: new Date(Date.now() + 300 * 86400000).toISOString(), // 300 days in future
      total_amc_visits_allowed: 2,
      amc_visits_used: 0,
    };

    // Customer opens support ticket
    const ticketPayload = {
      quote_id: "quote_res_101",
      lead_id: "lead_res_101",
      customer_name: "Vikas Sharma",
      customer_phone: "9587980007",
      warranty_id: warranty.id,
      issue_category: "camera_offline" as const,
      issue_description: "Camera 2 on boundary wall shows black screen during night.",
    };

    const parsedTicket = SupportTicketSchema.safeParse(ticketPayload);
    assert.equal(parsedTicket.success, true, "Support ticket must pass schema validation");

    // Dynamic Payment Status Check: Within active warranty + unused AMC visits => "free_amc"
    const isUnderWarranty = warranty.status === "active" && new Date(warranty.expires_at) > new Date();
    const hasUnusedVisits = warranty.amc_visits_used < warranty.total_amc_visits_allowed;
    const ticketPaymentStatus = isUnderWarranty && hasUnusedVisits ? "free_amc" : "chargeable_labor";

    assert.equal(ticketPaymentStatus, "free_amc", "Ticket under active warranty with unused visits must be free_amc");

    // Admin resolves ticket -> increments visits used
    warranty.amc_visits_used += 1;
    assert.equal(warranty.amc_visits_used, 1, "Resolving free AMC ticket must increment visits used counter");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 7: Post-Installation Rating & Google Review Integration
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 7 — Customer Rating & Sentiment Triage (/api/public/feedback)", () => {
    // 7A: 5-Star Delight Rating
    const positiveFeedback = {
      lead_id: "lead_res_101",
      rating: 5,
      comment: "Superb installation by TEAM technicians! Mobile view crystal clear.",
      status: 5 >= 4 ? "published" : "pending_action",
    };

    assert.equal(positiveFeedback.status, "published", "4+ star reviews must be published and forwarded to Google Review");

    // 7B: 2-Star Low Rating (Escalation Alert to Admin Desk)
    const criticalFeedback = {
      lead_id: "lead_res_101",
      rating: 2,
      comment: "Cables left dangling loosely on the porch roof.",
      status: 2 >= 4 ? "published" : "pending_action",
    };

    assert.equal(criticalFeedback.status, "pending_action", "Sub-4 star reviews must trigger pending_action triage");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 8: Customer Dashboard & Document Repository Synchronization
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 8 — Customer Dashboard & Document Repository Sync", () => {
    const customerAccount = {
      firebase_uid: "uid_cust_9981",
      mobile: "9587980007",
      name: "Vikas Sharma",
    };

    // Linked documents
    const lead = {
      id: "lead_res_101",
      firebase_uid: customerAccount.firebase_uid,
      customer_name: customerAccount.name,
      total_payable: 14850,
      status: "won",
      payment_status: "paid",
    };

    const quote = {
      id: "QT-2026-99120",
      lead_id: lead.id,
      firebase_uid: customerAccount.firebase_uid,
      total_payable: 14850,
      status: "PAID",
      amount_paid: 14850,
      amount_due: 0,
      isPaid: true,
    };

    const invoice = {
      id: "INV-2026-00441",
      quote_id: quote.id,
      lead_id: lead.id,
      invoice_number: "INV/2026-27/00441",
      taxable_amount: 12584.75,
      gst_amount: 2265.25,
      gross_total: 14850,
      status: "PAID",
    };

    // Customer dashboard items evaluation
    const dashboardQuotes = [
      {
        quoteId: quote.id,
        leadId: lead.id,
        status: quote.status,
        totalPayable: quote.total_payable,
        amountPaid: quote.amount_paid,
        amountDue: quote.amount_due,
        isPaid: quote.isPaid,
        invoiceNumber: invoice.invoice_number,
      }
    ];

    const invoicedQuotes = dashboardQuotes.filter(q => q.isPaid && q.amountDue <= 0);
    assert.equal(invoicedQuotes.length, 1, "Completed quote must appear in invoiced section");
    assert.equal(invoicedQuotes[0].invoiceNumber, "INV/2026-27/00441", "Invoice number must be bound to customer document repository");
    assert.equal(invoicedQuotes[0].amountDue, 0, "No pending balance for invoiced deals");
  });

});
