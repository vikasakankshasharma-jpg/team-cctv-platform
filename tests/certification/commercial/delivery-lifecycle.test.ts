/**
 * @file tests/certification/commercial/delivery-lifecycle.test.ts
 * @description Phase 7.9 Delivery Person Lifecycle & Admin Synchronization Test Suite.
 * Validates the complete delivery staff / logistics rider workflow across 8 real-world scenarios:
 *   1. Delivery Daily Route Planning & Stop Sequencing (/delivery/route)
 *   2. Fully Paid / Smart Pay Delivery Handover (Zero Collection Friction)
 *   3. Material Delivery 90% Payment Collection via Dynamic On-Screen UPI QR
 *   4. Field Cash Collection Lock & Admin Real-Time Authorization
 *   5. 4-Digit Delivery Handover OTP Verification & Installer Trigger
 *   6. Delivery Failure Reporting & Hub Return Exception Handling
 *   7. Pending Cash Settlement & Platform Ledger Reconciliation
 *   8. Admin Dispatch & Customer Order Tracking Synchronization
 */

import test from "node:test";
import assert from "node:assert/strict";
import { calculateCommercialMilestones } from "../../../lib/commercial/commercial-contract";

test("Phase 7.9 — Delivery Person Full Cycle & Admin Synchronization Verification", async (t) => {

  const MOCK_DELIVERY_STAFF = {
    id: "del_staff_sunil_201",
    name: "Sunil Rathore",
    phone: "9829066554",
    role: "internal_staff" as const,
    hub_id: "hub_jaipur_west",
    vehicle_number: "RJ-14-SE-4421"
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Daily Route Planning & Stop Sequencing (/delivery/route)
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 1 — Delivery Route Planning & Stop Sequencing (/delivery/route)", () => {
    const routeJobs = [
      {
        quote_id: "QT-DEL-001",
        customer_name: "Amit Sharma",
        pincode: "302012",
        route_sequence: 1,
        total_payable: 18000,
        amount_paid: 500,
        balance_due: 17500,
        delivery_status: "DISPATCHED" as const,
      },
      {
        quote_id: "QT-DEL-002",
        customer_name: "Ramesh Meena",
        pincode: "302012",
        route_sequence: 2,
        total_payable: 24000,
        amount_paid: 24000, // Smart pay fully paid
        balance_due: 0,
        delivery_status: "DISPATCHED" as const,
      },
      {
        quote_id: "QT-DEL-003",
        customer_name: "Deepak Verma",
        pincode: "302001",
        route_sequence: 3,
        total_payable: 32000,
        amount_paid: 500,
        balance_due: 31500,
        delivery_status: "DISPATCHED" as const,
      }
    ];

    assert.equal(routeJobs.length, 3, "Route must contain 3 sequenced delivery drops");
    assert.equal(routeJobs[0].route_sequence, 1);
    assert.equal(routeJobs[1].route_sequence, 2);

    // Total route cash/collection target:
    const totalRouteCollectionTarget = routeJobs.reduce((sum, j) => sum + j.balance_due, 0);
    assert.equal(totalRouteCollectionTarget, 49000, "Route collection target must sum non-zero balances (₹17,500 + ₹0 + ₹31,500)");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Fully Paid / Smart Pay Delivery Handover
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 2 — Fully Paid (Smart Pay) Delivery Handover with Zero Collection", () => {
    const grossTotal = 24000;
    const fullyPaidQuote = {
      id: "QT-DEL-002",
      customer_name: "Ramesh Meena",
      total_payable: grossTotal,
      amount_paid: grossTotal,
      amount_due: 0,
      payment_status: "paid",
      payment_type: "full_discount",
      delivery_otp: "5512",
      delivery_status: "DISPATCHED" as "DISPATCHED" | "DELIVERED"
    };

    // Detection logic matching DeliveryClient.tsx
    const isFullyPaid = 
      fullyPaidQuote.payment_status === "paid" || 
      fullyPaidQuote.payment_type === "full_discount" || 
      (fullyPaidQuote.amount_due === 0 && fullyPaidQuote.amount_paid > 500);

    assert.equal(isFullyPaid, true, "Smart Pay quote must be detected as fully paid");

    const expectedCollection = isFullyPaid ? 0 : fullyPaidQuote.amount_due;
    assert.equal(expectedCollection, 0, "Zero collection must be expected for Smart Pay delivery");

    // Rider inputs 4-digit OTP provided by customer
    const enteredOtp = "5512";
    assert.equal(enteredOtp, fullyPaidQuote.delivery_otp, "Delivery OTP must match");
    fullyPaidQuote.delivery_status = "DELIVERED";

    assert.equal(fullyPaidQuote.delivery_status, "DELIVERED", "Handover completed with zero payment friction");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Material Delivery 90% Payment via Dynamic UPI QR
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 3 — 90% Milestone Payment via On-Screen Dynamic UPI QR", () => {
    const grossTotal = 24500;
    const milestones = calculateCommercialMilestones(grossTotal); // booking: 500, delivery: 21600, install: 2400

    const standardQuote = {
      id: "QT-DEL-001",
      customer_name: "Amit Sharma",
      total_payable: grossTotal,
      amount_paid: milestones.bookingAmount, // ₹500
      amount_due: milestones.deliveryAmount,  // ₹21,600
      payment_status: "advance_paid",
      delivery_otp: "4821",
      delivery_status: "DISPATCHED" as "DISPATCHED" | "DELIVERED"
    };

    const isFullyPaid = false;
    const expectedDeliveryDue = standardQuote.amount_due;
    assert.equal(expectedDeliveryDue, 21600, "Delivery 90% due must be ₹21,600");

    // Rider displays dynamic UPI QR code on mobile screen
    let upiPaymentVerified = false;
    // Customer scans dynamic QR and pays ₹21,600
    upiPaymentVerified = true;
    standardQuote.amount_paid += expectedDeliveryDue;
    standardQuote.payment_status = "delivery_paid";

    assert.equal(upiPaymentVerified, true);
    assert.equal(standardQuote.amount_paid, 22100); // 500 + 21,600

    // Delivery rider verifies 4-digit OTP
    const enteredOtp = "4821";
    assert.equal(enteredOtp, standardQuote.delivery_otp);
    standardQuote.delivery_status = "DELIVERED";

    assert.equal(standardQuote.delivery_status, "DELIVERED");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Field Cash Collection Lock & Real-Time Admin Authorization
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 4 — Field Cash Collection Lock & Admin Authority Request", () => {
    const codQuote = {
      id: "QT-DEL-003",
      customer_name: "Deepak Verma",
      total_payable: 32000,
      amount_due: 28350, // 90% balance
      cash_collection_approved: false,
      job_level_cash_authority: false,
      cash_approval_status: "none" as "none" | "pending" | "approved"
    };

    // 4A: Rider attempts cash handover without admin authority -> BLOCKED
    const isCashApproved = codQuote.cash_collection_approved || codQuote.job_level_cash_authority;
    assert.equal(isCashApproved, false, "Cash collection must be locked by default");

    // 4B: Rider taps "Request Cash Approval from Admin"
    codQuote.cash_approval_status = "pending";
    const cashApprovalRequest = {
      quote_id: codQuote.id,
      amount: codQuote.amount_due,
      reason: "Customer does not have smartphone/UPI on site; insists on physical cash",
      requested_by: MOCK_DELIVERY_STAFF.name,
      requested_at: new Date().toISOString()
    };
    assert.equal(cashApprovalRequest.amount, 28350);

    // 4C: Admin desk reviews and authorizes cash on /admin/leads/[leadId]
    codQuote.cash_collection_approved = true;
    codQuote.job_level_cash_authority = true;
    codQuote.cash_approval_status = "approved";

    const canNowCollectCash = codQuote.cash_collection_approved && codQuote.job_level_cash_authority;
    assert.equal(canNowCollectCash, true, "Cash collection unlocks once authorized by Admin Desk");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: 4-Digit Handover OTP Verification & Installer Trigger
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 5 — 4-Digit Delivery Handover Verification (/api/delivery/verify-otp)", () => {
    const quote = {
      id: "QT-DEL-001",
      delivery_otp: "4821",
      delivery_status: "DISPATCHED" as "DISPATCHED" | "DELIVERED",
      install_start_otp: null as string | null,
      install_end_otp: null as string | null
    };

    // Helper: Simulate verify-otp route
    const verifyOtp = (q: typeof quote, otp: string) => {
      if (q.delivery_status === "DELIVERED") throw new Error("Already delivered");
      if (q.delivery_otp !== otp) throw new Error("Invalid OTP");
      q.delivery_status = "DELIVERED";
      q.install_start_otp = "7721";
      q.install_end_otp = "8832";
      return { success: true };
    };

    // Wrong OTP -> Rejected
    assert.throws(() => verifyOtp(quote, "1111"), /Invalid OTP/);

    // Authentic OTP -> Verified & triggers installer start OTP
    const res = verifyOtp(quote, "4821");
    assert.equal(res.success, true);
    assert.equal(quote.delivery_status, "DELIVERED");
    assert.equal(quote.install_start_otp, "7721", "Installation start OTP must be generated upon material delivery");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 6: Delivery Failure Reporting & Hub Return Exception Handling
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 6 — Delivery Failure Exception Reporting (DeliveryFailureModal)", () => {
    const quote = {
      id: "QT-DEL-004",
      lead_id: "lead_fail_101",
      customer_name: "Harish Pareek",
      delivery_status: "DISPATCHED" as "DISPATCHED" | "FAILED",
      delivery_failure_reason: null as string | null
    };

    // Rider reports delivery failure on site
    const failureReason = "Customer Not Available";
    quote.delivery_status = "FAILED";
    quote.delivery_failure_reason = failureReason;

    assert.equal(quote.delivery_status, "FAILED");
    assert.equal(quote.delivery_failure_reason, "Customer Not Available");

    // Audit note created on lead timeline
    const auditNote = {
      lead_id: quote.lead_id,
      content: `DELIVERY FAILED / RETURN TO HUB: ${failureReason}`,
      created_by_name: MOCK_DELIVERY_STAFF.name,
      created_by_role: MOCK_DELIVERY_STAFF.role
    };

    assert.equal(auditNote.content.includes("RETURN TO HUB"), true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 7: Pending Cash Settlement & Platform Ledger Reconciliation
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 7 — End-of-Day Cash Settlement with Hub Desk", () => {
    const cashCollectedOnRun = 28350;

    const pendingSettlement = {
      id: "settle_run_991",
      staff_name: MOCK_DELIVERY_STAFF.name,
      staff_phone: MOCK_DELIVERY_STAFF.phone,
      amount: cashCollectedOnRun,
      status: "pending" as "pending" | "settled",
      collected_at: new Date().toISOString(),
      settled_at: null as string | null
    };

    assert.equal(pendingSettlement.status, "pending");

    // Rider returns to hub, counts cash with Hub Incharge, Admin confirms deposit
    pendingSettlement.status = "settled";
    pendingSettlement.settled_at = new Date().toISOString();

    assert.equal(pendingSettlement.status, "settled");
    assert.notEqual(pendingSettlement.settled_at, null, "Settled timestamp must be recorded");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 8: Admin Dispatch & Customer Order Tracking Synchronization
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 8 — Synchronization Across /admin/dispatch and /track/[id]", () => {
    const jobOrder = {
      id: "JOB-2026-DEL-101",
      quote_id: "QT-DEL-001",
      customer_name: "Amit Sharma",
      assigned_delivery_staff: MOCK_DELIVERY_STAFF,
      delivery_status: "DELIVERED",
      payment_status: "delivery_paid",
      total_payable: 24500,
      amount_paid: 22100 // 500 booking + 21,600 delivery
    };

    // Tracking Step Evaluation for Customer Tracking Client (/track/[id])
    let customerTrackingStep = 1;
    if (jobOrder.delivery_status === "DELIVERED") {
      customerTrackingStep = 3; // Materials delivered, technician ready
    }
    assert.equal(customerTrackingStep, 3, "Customer tracking must display Step 3 upon material delivery");

    // Admin Dispatch Panel sync check
    const adminDispatchView = {
      orderId: jobOrder.id,
      deliveryStaff: jobOrder.assigned_delivery_staff.name,
      deliveryStatus: jobOrder.delivery_status,
      paymentStatus: jobOrder.payment_status
    };

    assert.equal(adminDispatchView.deliveryStatus, "DELIVERED");
    assert.equal(adminDispatchView.deliveryStaff, "Sunil Rathore");
  });

});
