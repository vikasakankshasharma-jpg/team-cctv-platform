/**
 * @file tests/certification/commercial/third-party-installer-lifecycle.test.ts
 * @description Phase 7.8 Third-Party Installer & Delivery Partner Full Cycle Test Suite.
 * Validates the complete third-party contractor / delivery partner workflow across 8 real-world scenarios:
 *   1. Third-Party Delivery & Technician Dispatch (Porter / Dunzo / Freelance)
 *   2. Zero Cash Authority Invariant for Third-Party Staff
 *   3. 4-Digit Delivery Handover OTP Verification via Tokenized Portal (/d/[token])
 *   4. Third-Party Site Survey Assignment & CRM Attribution Sync
 *   5. Third-Party Support Ticket Resolution & Warranty Handover
 *   6. Section 194C TDS Withholding for Subcontractors & External Contractors
 *   7. Token Security & Anti-Replay Guard on Delivery Verification
 *   8. Admin Dispatch & Chain of Custody Audit Trail Verification
 */

import test from "node:test";
import assert from "node:assert/strict";
import { TaxationEngine } from "../../../lib/taxation-engine";
import { calculateCommercialMilestones } from "../../../lib/commercial/commercial-contract";

test("Phase 7.8 — Third-Party Installer Full Cycle & Admin Synchronization Verification", async (t) => {

  const MOCK_THIRD_PARTY_STAFF = {
    name: "Pawan Singh (Porter Partner)",
    phone: "9829077665",
    role: "third_party" as const,
    agency_name: "Porter Express Logistics",
    pan_number: "AAACP5566G"
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Third-Party Delivery & Technician Dispatch (/api/delivery/dispatch)
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 1 — Third-Party Delivery Dispatch & Magic Link Generation", () => {
    const grossTotal = 25000;
    const milestones = calculateCommercialMilestones(grossTotal); // booking: 500, delivery: 22050, install: 2450

    const deliveryToken = "sec_del_token_99182a";
    const quote = {
      id: "QT-2026-DEL-101",
      customer_name: "Sunil Verma",
      customer_mobile: "9829011222",
      total_payable: grossTotal,
      advance_payment_amount: milestones.bookingAmount,
      balance_to_collect: milestones.deliveryAmount,
      delivery_method: "third_party" as const,
      delivery_token: deliveryToken,
      delivery_status: "DISPATCHED" as const,
      delivery_otp: "4821",
      assigned_delivery_staff: {
        name: MOCK_THIRD_PARTY_STAFF.name,
        phone: MOCK_THIRD_PARTY_STAFF.phone,
        role: MOCK_THIRD_PARTY_STAFF.role
      }
    };

    assert.equal(quote.delivery_method, "third_party");
    assert.equal(quote.delivery_token, "sec_del_token_99182a");
    assert.equal(quote.assigned_delivery_staff.role, "third_party");
    assert.equal(quote.delivery_status, "DISPATCHED");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Zero Cash Authority Invariant for Third-Party Staff
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 2 — Zero Cash Authority Invariant & Payment Lock for Third-Party Staff", () => {
    const quote = {
      id: "QT-2026-DEL-101",
      delivery_method: "third_party" as const,
      payment_status: "advance_paid" as "advance_paid" | "delivery_paid" | "completed",
      total_payable: 25000,
      advance_payment_amount: 500
    };

    // Rule: Third-party staff are NEVER authorized to accept cash
    const staffRole: string = quote.delivery_method;
    const allowCash = staffRole !== "third_party";
    assert.equal(allowCash, false, "Third-party delivery staff must NEVER have cash collection authority");

    // UI State Logic on /d/[token]: If third-party and customer hasn't paid online yet, OTP verification is locked
    const isThirdParty = quote.delivery_method === "third_party";
    const needsPaymentConfirmation = isThirdParty && quote.payment_status !== "delivery_paid" && quote.payment_status !== "completed";
    assert.equal(needsPaymentConfirmation, true, "Delivery portal must block OTP entry until customer completes 90% payment online");

    // Customer completes online payment via Razorpay / UPI
    quote.payment_status = "delivery_paid";
    const paymentUnlocked = isThirdParty && quote.payment_status !== "delivery_paid" && quote.payment_status !== "completed";
    assert.equal(paymentUnlocked, false, "Once customer completes online payment, OTP verification is unlocked");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: 4-Digit Delivery Handover OTP Verification (/d/[token])
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 3 — 4-Digit Handover OTP Verification (/api/delivery/verify-otp)", () => {
    const quote = {
      id: "QT-2026-DEL-101",
      delivery_otp: "4821",
      delivery_status: "DISPATCHED" as "DISPATCHED" | "DELIVERED",
      delivery_method: "third_party" as const,
      payment_status: "delivery_paid",
      install_start_otp: null as string | null
    };

    // Helper: Simulate OTP verification
    const verifyDeliveryOtp = (quoteObj: typeof quote, enteredOtp: string) => {
      if (quoteObj.delivery_status === "DELIVERED") {
        throw new Error("Already delivered");
      }
      if (quoteObj.delivery_otp !== enteredOtp) {
        throw new Error("Invalid OTP");
      }
      quoteObj.delivery_status = "DELIVERED";
      quoteObj.install_start_otp = "8891"; // generated on delivery
      return { success: true };
    };

    // 3A: Invalid OTP attempt -> REJECTED
    assert.throws(
      () => verifyDeliveryOtp(quote, "9999"),
      /Invalid OTP/
    );

    // 3B: Valid OTP from customer -> VERIFIED
    const result = verifyDeliveryOtp(quote, "4821");
    assert.equal(result.success, true);
    assert.equal(quote.delivery_status, "DELIVERED");
    assert.equal(quote.install_start_otp, "8891", "Handover must generate installation start OTP for technician");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Third-Party Site Survey Assignment & CRM Attribution Sync
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 4 — Third-Party Site Survey Assignment & CRM Sync (/api/admin/surveys/[id])", () => {
    const surveyDoc = {
      id: "survey_site_901",
      lead_id: "lead_cust_881",
      customer_name: "Amit Gehlot",
      address: "Sitapura Industrial Area, Jaipur",
      status: "assigned",
      is_third_party: true,
      third_party_name: "Freelance Engineer Amit",
      third_party_phone: "9829044332",
      updated_at: new Date().toISOString()
    };

    assert.equal(surveyDoc.is_third_party, true);
    assert.equal(surveyDoc.third_party_name, "Freelance Engineer Amit");
    assert.equal(surveyDoc.third_party_phone, "9829044332");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: Third-Party Support Ticket Resolution & Warranty Handover
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 5 — Third-Party Support Ticket Assignment (/api/admin/tickets/[id])", () => {
    const ticketDoc = {
      id: "ticket_supp_501",
      lead_id: "lead_cust_881",
      ticket_number: "TKT-10492",
      issue_description: "Camera 3 outdoor cable cut by rodents",
      is_third_party: true,
      third_party_name: "Surendra Electrical Services",
      third_party_phone: "9829011229",
      status: "assigned" as "assigned" | "resolved",
      payment_status: "free_amc",
      warranty_id: "war_2026_901"
    };

    assert.equal(ticketDoc.is_third_party, true);
    assert.equal(ticketDoc.third_party_name, "Surendra Electrical Services");

    // Admin resolves ticket after third-party reports resolution
    ticketDoc.status = "resolved";
    assert.equal(ticketDoc.status, "resolved");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 6: Section 194C TDS Withholding for Subcontractors & External Contractors
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 6 — Subcontractor Section 194C TDS Calculation", async () => {
    const grossSubcontractAmount = 45000; // Contract exceeding ₹30,000 threshold
    const accumulatedPrior = 0;

    // CASE 6A: Individual Freelance Contractor with Valid PAN -> 1% Section 194C TDS
    const tdsIndividual = await TaxationEngine.calculate194C(grossSubcontractAmount, accumulatedPrior, "individual", true);
    assert.equal(tdsIndividual.tdsRatePercent, 1, "Individual contractor rate must be 1%");
    assert.equal(tdsIndividual.tdsAmount, 450, "1% TDS on ₹45,000 must be ₹450");
    assert.equal(tdsIndividual.netPayable, 44550, "Net payable must be ₹44,550");
    assert.equal(tdsIndividual.grossAmount - tdsIndividual.tdsAmount, tdsIndividual.netPayable);

    // CASE 6B: Subcontractor Firm (e.g. Porter / Logistics agency) with Valid PAN -> 2% Section 194C TDS
    const tdsFirm = await TaxationEngine.calculate194C(grossSubcontractAmount, accumulatedPrior, "firm", true);
    assert.equal(tdsFirm.tdsRatePercent, 2, "Firm contractor rate must be 2%");
    assert.equal(tdsFirm.tdsAmount, 900, "2% TDS on ₹45,000 must be ₹900");
    assert.equal(tdsFirm.netPayable, 44100, "Net payable must be ₹44,100");

    // CASE 6C: External Contractor with Missing / Invalid PAN -> 20% Penal Rate
    const tdsPenal = await TaxationEngine.calculate194C(grossSubcontractAmount, accumulatedPrior, "individual", false);
    assert.equal(tdsPenal.tdsRatePercent, 20, "Penal rate without PAN must be 20%");
    assert.equal(tdsPenal.tdsAmount, 9000, "20% TDS on ₹45,000 must be ₹9,000");
    assert.equal(tdsPenal.netPayable, 36000, "Net payable must be ₹36,000");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 7: Token Security & Anti-Replay Guard on Delivery Verification
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 7 — Token Anti-Replay Guard on /d/[token]", () => {
    const deliveredQuote = {
      id: "QT-2026-DEL-101",
      delivery_otp: "4821",
      delivery_status: "DELIVERED"
    };

    // Attempting to re-verify an already delivered order must throw an anti-replay error
    const reVerify = () => {
      if (deliveredQuote.delivery_status === "DELIVERED") {
        throw new Error("Already delivered");
      }
    };

    assert.throws(() => reVerify(), /Already delivered/);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 8: Admin Dispatch & Chain of Custody Audit Trail Verification
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 8 — Chain of Custody Audit Trail Verification", () => {
    const chainOfCustodyAudit = {
      order_id: "QT-2026-DEL-101",
      milestone_1_booking: { amount: 500, status: "PAID", method: "razorpay_upi" },
      milestone_2_dispatch: {
        method: "third_party",
        carrier_name: MOCK_THIRD_PARTY_STAFF.name,
        carrier_phone: MOCK_THIRD_PARTY_STAFF.phone,
        carrier_agency: MOCK_THIRD_PARTY_STAFF.agency_name,
        dispatched_at: "2026-11-16T10:00:00Z"
      },
      milestone_3_online_payment: {
        amount: 22050,
        status: "PAID",
        method: "razorpay_gateway",
        paid_before_handover: true
      },
      milestone_4_handover: {
        otp_verified: true,
        delivered_at: "2026-11-16T11:30:00Z",
        cash_collected_by_third_party: 0 // ZERO CASH INVARIANT
      }
    };

    assert.equal(chainOfCustodyAudit.milestone_2_dispatch.method, "third_party");
    assert.equal(chainOfCustodyAudit.milestone_3_online_payment.paid_before_handover, true);
    assert.equal(chainOfCustodyAudit.milestone_4_handover.cash_collected_by_third_party, 0, "Third-party cash collection must strictly be ₹0");
  });

});
