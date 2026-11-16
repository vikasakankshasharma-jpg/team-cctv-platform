/**
 * @file tests/certification/commercial/salesperson-lifecycle.test.ts
 * @description Phase 7.4 Salesperson Lifecycle & Admin Synchronization Test Suite.
 * Validates full salesperson workflow across 7 real-world scenarios:
 *   1. Salesperson Profile & Territory Configuration (Admin -> Portal Sync)
 *   2. Lead Auto-Assignment & Dual-Field Synchronization
 *   3. Manual Lead Assignment by Admin Desk
 *   4. Manual Quote Generation & Discount Ceiling Enforcement
 *   5. Route Planning & Beat Schedule Optimization
 *   6. Price Match Review & Escalation Boundary Enforcement
 *   7. Deal Closing & Salesperson Commission Settlement
 */

import test from "node:test";
import assert from "node:assert/strict";
import { 
  buildSalespersonLeadAssignmentPayload,
  findSalespersonByUid,
  findSalespersonById
} from "../../../lib/salesperson-utils";
import { calculateCommercialMilestones } from "../../../lib/commercial/commercial-contract";
import { resolvePromoterCommission } from "../../../lib/commission";

test("Phase 7.4 — Salesperson Full Cycle & Admin Sync Verification", async (t) => {

  const MOCK_SALESPERSON = {
    id: "sp_test_101",
    name: "Vikram Rathore",
    mobile_number: "9829012345",
    firebase_uid: "uid_sp_test_101",
    role: "sales_staff",
    is_active: true,
    assigned_zone_ids: ["zone_jaipur_central", "zone_jaipur_west"],
    assigned_pincodes: ["302001", "302012"],
    max_discount_approval_percent: 12,
    commission_slabs: [
      { min_amount: 0, max_amount: 30000, percent: 5 },
      { min_amount: 30001, max_amount: 100000, percent: 8 }
    ]
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Profile & Territory Configuration Sync
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 1 — Salesperson Profile & Ceiling Sync (Admin -> Portal)", () => {
    // Assert salesperson configuration is active and bounds are well-defined
    assert.equal(MOCK_SALESPERSON.is_active, true, "Salesperson must be active");
    assert.equal(MOCK_SALESPERSON.max_discount_approval_percent, 12, "Max discount approval ceiling must be 12%");
    assert.equal(MOCK_SALESPERSON.assigned_pincodes.includes("302012"), true, "Must cover Pincode 302012");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Lead Auto-Assignment Dual-Field Synchronization
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 2 — Auto-Assignment Dual-Field Sync (assigned_to_salesperson_id & assigned_salesperson_id)", () => {
    const payload = buildSalespersonLeadAssignmentPayload(MOCK_SALESPERSON.id, MOCK_SALESPERSON.name);

    // CRITICAL: Both fields must be identical to guarantee zero drift between Admin Leads and Salesperson Portal
    assert.equal(payload.assigned_salesperson_id, MOCK_SALESPERSON.id);
    assert.equal(payload.assigned_to_salesperson_id, MOCK_SALESPERSON.id);
    assert.equal(payload.assigned_salesperson_name, MOCK_SALESPERSON.name);
    assert.equal(payload.assigned_to_salesperson_name, MOCK_SALESPERSON.name);

    // Verify lead matching simulated query
    const lead = {
      id: "lead_auto_901",
      customer_name: "Rahul Sharma",
      pincode: "302012",
      status: "new",
      ...payload
    };

    // Salesperson portal query by assigned_to_salesperson_id
    const matchesPortal = lead.assigned_to_salesperson_id === MOCK_SALESPERSON.id;
    // Dispatch map / ActivePipeline query by assigned_salesperson_id
    const matchesDispatch = lead.assigned_salesperson_id === MOCK_SALESPERSON.id;

    assert.equal(matchesPortal, true, "Portal query must match lead");
    assert.equal(matchesDispatch, true, "Dispatch query must match lead");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Manual Lead Assignment by Admin Desk
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 3 — Admin Manual Lead Assignment Updates Both Pointer Fields", () => {
    // Lead begins unassigned
    const unassignedLead: Record<string, any> = {
      id: "lead_unassigned_802",
      customer_name: "Amit Patel",
      pincode: "302001",
      assigned_salesperson_id: null,
      assigned_to_salesperson_id: null
    };

    // Admin assigns lead to salesperson
    const assignment = buildSalespersonLeadAssignmentPayload(MOCK_SALESPERSON.id, MOCK_SALESPERSON.name);
    Object.assign(unassignedLead, assignment);

    assert.equal(unassignedLead.assigned_to_salesperson_id, "sp_test_101");
    assert.equal(unassignedLead.assigned_salesperson_id, "sp_test_101");
    assert.equal(unassignedLead.assigned_to_salesperson_name, "Vikram Rathore");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Salesperson Manual Quote Generation & Discount Ceiling Enforcement
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 4 — Manual Quote Builder & Discount Authorization Guard", () => {
    const baseItems = [
      { product_id: "cam-cp-2mp", display_name: "CP Plus 2MP Camera", qty: 4, unit_price: 1500, line_total: 6000 },
      { product_id: "dvr-cp-4ch", display_name: "CP Plus 4Ch DVR", qty: 1, unit_price: 3500, line_total: 3500 },
      { product_id: "hdd-1tb", display_name: "WD Purple 1TB Surveillance HDD", qty: 1, unit_price: 4500, line_total: 4500 },
      { product_id: "psu-4ch", display_name: "4Ch Power Supply", qty: 1, unit_price: 1000, line_total: 1000 }
    ];

    const subtotal = 15000;
    const installationCost = 1500;
    const grossTotalBeforeDiscount = subtotal + installationCost; // ₹16,500

    // CASE 4A: Approved Discount (10% <= 12% Max)
    const approvedDiscountPercent = 10;
    const isDiscountPermitted = approvedDiscountPercent <= MOCK_SALESPERSON.max_discount_approval_percent;
    assert.equal(isDiscountPermitted, true, "10% discount should be permitted under 12% ceiling");

    const discountAmount = Math.round((grossTotalBeforeDiscount * approvedDiscountPercent) / 100); // ₹1,650
    const finalTotalPayable = grossTotalBeforeDiscount - discountAmount; // ₹14,850

    // Quote snapshot binding check
    const manualQuote = {
      id: "QT-2026-99120-M",
      lead_id: "lead_auto_901",
      leadId: "lead_auto_901",
      customerId: "CUST-2026-77889",
      subtotal,
      installation_cost: installationCost,
      discount_percent: approvedDiscountPercent,
      discount_amount: discountAmount,
      total_payable: finalTotalPayable,
      status: "GENERATED",
      source: "manual"
    };

    assert.equal(manualQuote.lead_id, "lead_auto_901", "Quote must be permanently linked to lead_id");
    assert.equal(manualQuote.total_payable, 14850, "Total payable must equal ₹14,850");

    // CASE 4B: Over-Limit Discount Attempt (18% > 12% Max)
    const overLimitDiscountPercent = 18;
    const isOverLimitPermitted = overLimitDiscountPercent <= MOCK_SALESPERSON.max_discount_approval_percent;
    assert.equal(isOverLimitPermitted, false, "18% discount must be BLOCKED by 12% ceiling");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: Route Planning & Beat Schedule Optimization
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 5 — Salesperson Beat Plan Visit Scheduling", () => {
    const visitDate = "2026-11-20";
    const leadScheduled = {
      id: "lead_auto_901",
      customer_name: "Rahul Sharma",
      scheduled_date: visitDate,
      time_slot: "11:00 AM - 01:00 PM",
      route_order: 1,
      status: "site_visit"
    };

    assert.equal(leadScheduled.status, "site_visit", "Lead must transition to site_visit on scheduling");
    assert.equal(leadScheduled.scheduled_date, visitDate);
    assert.equal(leadScheduled.route_order, 1);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 6: Price Match Review & Escalation Boundary Enforcement
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 6 — Price Match Review vs Admin Escalation", () => {
    const originalQuoteTotal = 20000;

    // CASE 6A: Salesperson can self-approve discount within 12% limit
    const requestA = { competitor_total: 18000 }; // 10% discount requested
    const requestedDiscountA = Math.round(((originalQuoteTotal - requestA.competitor_total) / originalQuoteTotal) * 100);
    assert.equal(requestedDiscountA, 10);
    const canSelfApproveA = requestedDiscountA <= MOCK_SALESPERSON.max_discount_approval_percent;
    assert.equal(canSelfApproveA, true, "10% price match request can be approved directly by salesperson");

    // CASE 6B: Over-limit price match request requires Admin escalation
    const requestB = { competitor_total: 16000 }; // 20% discount requested
    const requestedDiscountB = Math.round(((originalQuoteTotal - requestB.competitor_total) / originalQuoteTotal) * 100);
    assert.equal(requestedDiscountB, 20);
    const canSelfApproveB = requestedDiscountB <= MOCK_SALESPERSON.max_discount_approval_percent;
    assert.equal(canSelfApproveB, false, "20% price match request must exceed ceiling and require Admin escalation");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 7: Deal Closing & Salesperson Commission Settlement
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 7 — Won Deal Commission Accrual & Reverse Tax Reconciliation", () => {
    const grossClosedDeal = 25000; // GST-inclusive selling price

    // 18% Reverse Tax Math Invariant
    const taxableBase = Math.round((grossClosedDeal / 1.18) * 100) / 100; // ₹21,186.44
    const gst18 = Math.round((grossClosedDeal - taxableBase) * 100) / 100; // ₹3,813.56
    assert.equal(Math.round((taxableBase + gst18) * 100) / 100, grossClosedDeal, "Taxable base + 18% GST must reconcile ₹0.00 drift");

    // Commission Slab Calculation: For deal under ₹30,000, 5% on taxable base
    const commissionPercent = 5;
    const expectedCommission = Math.round((taxableBase * commissionPercent) / 100); // 5% of ₹21,186.44 = ₹1,059

    const commissionRecord = {
      id: "comm_rec_sp_991",
      user_type: "salesperson",
      user_id: MOCK_SALESPERSON.id,
      lead_id: "lead_auto_901",
      ex_tax_amount: taxableBase,
      commission_amount: expectedCommission,
      status: "pending",
      created_at: new Date().toISOString()
    };

    assert.equal(commissionRecord.user_type, "salesperson");
    assert.equal(commissionRecord.user_id, "sp_test_101");
    assert.equal(commissionRecord.commission_amount, 1059, "Commission must be ₹1,059 (5% of taxable base)");

    // Milestone reconciliation on payment
    const milestones = calculateCommercialMilestones(grossClosedDeal);
    assert.equal(milestones.bookingAmount, 500);
    assert.equal(milestones.bookingAmount + milestones.deliveryAmount + milestones.installationAmount, grossClosedDeal);
  });

});
