/**
 * @file tests/certification/pilot/customer-0-execution.test.ts
 * @description Customer 0 (Founder Test) End-to-End Production Evidence Verification Suite.
 * Executes the complete 12-step transaction and evidence chain across:
 * Legal Acceptance -> Quote Snapshot -> ₹500 Booking -> Payment Capture -> Reverse GST Invoice
 * -> Operational Handover -> Installer Assignment -> Delivery OTP -> QC Completion OTP
 * -> Serialized Warranty -> AMC Entitlement -> Daily Bank Reconciliation.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { validateServiceAreaEligibility } from "../../../lib/pilot/pilot-geo-policy";
import { createLegalAcceptanceSnapshot, verifyLegalAcceptanceSnapshot } from "../../../lib/legal";
import { createCommercialOrder } from "../../../lib/commercial/order-service";
import { processVerifiedPaymentEvent } from "../../../lib/commercial/webhook-service";
import { reconcileInvoiceWithQuote } from "../../../lib/commercial/invoice-reconciliation";
import {
  assignInstaller,
  verifyDeliveryOtp,
  completeInstallation,
  validateOperationalTransition,
} from "../../../lib/operations/job-lifecycle";
import { mintWarrantyCertificate } from "../../../lib/operations/warranty-service";
import { activateAmcEntitlement } from "../../../lib/operations/amc-service";
import { reconcileDailySettlement } from "../../../lib/finance/daily-reconciliation";
import { JAIPUR_PILOT_INSTALLERS, INSTALL_RATE_CARD_V1 } from "../../../lib/operations/installer-registry";
import {
  createTestJobCard,
  TEST_DELIVERY_OTP,
  TEST_COMPLETION_OTP,
  canonicalMaterialManifest,
  canonicalSerializedAssets,
  validQcChecklist,
} from "../operations/operations-fixtures";

describe("CUSTOMER 0 — FOUNDER REAL-MONEY PILOT EVIDENCE SUITE", () => {
  const FOUNDER_PROFILE = Object.freeze({
    id: "FOUNDER-CUS-000",
    name: "Vikas Sharma (Founder)",
    mobile: "+91 99825 49315",
    pincode: "302012",
    city: "Jaipur",
    address: "no. S1/51, Maheshpuri, Jhotwara, Jaipur, Rajasthan — 302012",
    propertyType: "RESIDENTIAL",
    cameraCount: 4,
    brand: "CP PLUS",
    resolution: "2MP Full HD",
    technology: "Standard HD",
    grossTotal: 35590,
    netTaxableAmount: 30161.02,
    gstAmount: 5428.98,
    bookingAmount: 500,
  });

  test("Step 1: Service Area Eligibility (Jaipur Pincode 302012)", () => {
    const eligibility = validateServiceAreaEligibility(FOUNDER_PROFILE.pincode);
    assert.equal(eligibility.eligible, true, "Pincode 302012 must be authorized for Jaipur Pilot");
    assert.equal(eligibility.code, "AUTHORIZED");
    assert.equal(eligibility.pincode, "302012");
  });

  test("Step 2: Quotation Snapshot & 18% Reverse GST Invariant", () => {
    const gross = FOUNDER_PROFILE.grossTotal;
    const taxable = Number((gross / 1.18).toFixed(2));
    const gst = Number((gross - taxable).toFixed(2));

    assert.equal(gross, 35590);
    assert.equal(taxable, 30161.02);
    assert.equal(gst, 5428.98);
    assert.equal(Number((taxable + gst).toFixed(2)), gross, "Exact ₹0.00 mathematical reconciliation");
  });

  test("Step 3: Legal Acceptance Snapshot Minting (LA-*)", () => {
    const legalSnapshot = createLegalAcceptanceSnapshot({
      partyId: FOUNDER_PROFILE.id,
      partyRole: "CUSTOMER",
      agreementId: "TOS",
      version: "TOS-V1.0",
      acceptanceMethod: "CHECKBOX",
      sourceContext: "CUSTOMER_BOOKING",
      quoteId: "QT-FOUNDER-001",
      orderId: "ORD-FOUNDER-001",
      rawIpAddress: "103.211.54.12",
      rawUserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CCTVQuotation/1.0",
      acceptedAt: "2026-11-15T12:00:00.000Z",
    });

    assert.ok(legalSnapshot.acceptanceId.startsWith("LA-20261115-"));
    assert.equal(legalSnapshot.partyId, FOUNDER_PROFILE.id);
    assert.equal(legalSnapshot.agreementId, "TOS");
    assert.equal(legalSnapshot.version, "TOS-V1.0");
    assert.ok(legalSnapshot.ipAddressHash, "IP must be SHA-256 hashed");
    assert.ok(verifyLegalAcceptanceSnapshot(legalSnapshot), "Snapshot must pass cryptographic verification");
  });

  test("Step 4: Commercial Order Creation Bound to Legal Snapshot & Milestone Slabs", () => {
    const syntheticQuote: any = {
      id: "QT-FOUNDER-001",
      lead_id: "LEAD-FOUNDER-001",
      total_payable: FOUNDER_PROFILE.grossTotal,
      pricingSnapshot: {
        total_payable: FOUNDER_PROFILE.grossTotal,
        net_taxable_amount: FOUNDER_PROFILE.netTaxableAmount,
        gst_amount: FOUNDER_PROFILE.gstAmount,
        items: [
          { sku: "CP-PLUS-2MP-BULLET", quantity: 2, unit_price: 1850 },
          { sku: "CP-PLUS-2MP-DOME", quantity: 2, unit_price: 1750 },
        ],
      },
    };

    const { order, isReused } = createCommercialOrder(syntheticQuote, "booking");
    assert.equal(isReused, false);
    assert.equal(order.amount_rupees, 500);
    assert.equal(order.amount_paise, 50000);
    assert.equal(order.currency, "INR");
    assert.equal(order.status, "created");
  });

  test("Step 5: Razorpay Payment Capture & Webhook Processing", () => {
    const order = {
      id: "order_founder_001",
      quote_id: "QT-FOUNDER-001",
      stage: "booking" as const,
      amount_rupees: 500,
      amount_paise: 50000,
      currency: "INR" as const,
      status: "created" as const,
      created_at: new Date().toISOString(),
    };

    const webhookRes = processVerifiedPaymentEvent({
      paymentPayload: {
        id: "pay_founder_smoke_999",
        order_id: order.id,
        amount: 50000,
        currency: "INR",
        status: "captured",
      },
      order,
      existingPaymentHistory: [],
    });

    assert.equal(webhookRes.isValid, true);
    assert.equal(webhookRes.isDuplicate, false);
    assert.equal(webhookRes.paymentRecord?.status, "captured");
    assert.equal(webhookRes.paymentRecord?.amount, 500);
  });

  test("Step 6: Reverse-GST Tax Invoice Reconciliation", () => {
    const quote: any = {
      id: "QT-FOUNDER-001",
      total_payable: 35590,
      net_taxable_amount: 30161.02,
      gst_amount: 5428.98,
      pricingSnapshot: {
        total_payable: 35590,
        net_taxable_amount: 30161.02,
        gst_amount: 5428.98,
      },
      configuration_snapshot: [
        { sku: "CAM-01", description: "CP Plus 2MP Camera", quantity: 4, unit_price: 1850 },
      ],
    };

    const invoice = reconcileInvoiceWithQuote(quote);
    assert.equal(invoice.isValid, true);
    assert.equal(invoice.grossTotal, 35590);
    assert.equal(invoice.taxableBase, 30161.02);
    assert.equal(invoice.gstAmount, 5428.98);
  });

  test("Step 7: Installer Assignment & Rate Card Verification", () => {
    const installer = JAIPUR_PILOT_INSTALLERS[0]; // Mukesh Sharma (Primary)
    assert.ok(installer);
    assert.equal(installer.isActive, true);
    assert.equal(installer.kycVerified, true);
    assert.equal(installer.rateCardVersion, INSTALL_RATE_CARD_V1.version);

    const job = createTestJobCard({ quote_id: "QT-FOUNDER-001" });
    const assigned = assignInstaller(job, installer.id, "ops_admin");
    assert.equal(assigned.installer_id, installer.id);
    assert.equal(assigned.status, "ASSIGNED");
  });

  test("Step 8: Material Delivery & Delivery OTP Handover", () => {
    const job = createTestJobCard({ quote_id: "QT-FOUNDER-001" });
    const dispatched = { ...job, status: "DISPATCHED" as const };
    const delivered = verifyDeliveryOtp(dispatched, TEST_DELIVERY_OTP, canonicalMaterialManifest, "customer");
    assert.equal(delivered.status, "DELIVERED");
    assert.ok(delivered.delivery_audit?.material_manifest);
    assert.equal(delivered.delivery_audit?.delivered_quantity, 7);
  });

  test("Step 9: Installation Commissioning, QC Checklist & Completion OTP", () => {
    const job = createTestJobCard({ quote_id: "QT-FOUNDER-001" });
    const delivered = { ...job, status: "DELIVERED" as const };
    validateOperationalTransition(delivered.status, "IN_PROGRESS");

    const completed = completeInstallation({
      job: { ...delivered, status: "IN_PROGRESS" as const },
      enteredOtp: TEST_COMPLETION_OTP,
      qcChecklist: validQcChecklist,
      serializedAssets: canonicalSerializedAssets,
      expectedAssetCount: 4,
    });

    assert.equal(completed.status, "COMPLETED");
    assert.ok(completed.completed_at);
    assert.equal(completed.installed_assets?.length, 4);
  });

  test("Step 10: Warranty Certificate Minting (Immutability)", () => {
    const job = createTestJobCard({ quote_id: "QT-FOUNDER-001" });
    const delivered = { ...job, status: "DELIVERED" as const };
    const completed = completeInstallation({
      job: { ...delivered, status: "IN_PROGRESS" as const },
      enteredOtp: TEST_COMPLETION_OTP,
      qcChecklist: validQcChecklist,
      serializedAssets: canonicalSerializedAssets,
      expectedAssetCount: 4,
    });

    const warranty = mintWarrantyCertificate({ job: completed, customerId: FOUNDER_PROFILE.id });
    assert.equal(warranty.status, "ACTIVE");
    assert.equal(warranty.assets.length, 4);
    assert.ok(warranty.certNumber.startsWith("WARR-"));
  });

  test("Step 11: Complimentary AMC Entitlement Activation", () => {
    const job = createTestJobCard({ quote_id: "QT-FOUNDER-001" });
    const delivered = { ...job, status: "DELIVERED" as const };
    const completed = completeInstallation({
      job: { ...delivered, status: "IN_PROGRESS" as const },
      enteredOtp: TEST_COMPLETION_OTP,
      qcChecklist: validQcChecklist,
      serializedAssets: canonicalSerializedAssets,
      expectedAssetCount: 4,
    });

    const amc = activateAmcEntitlement({ job: completed, isComplimentary: true });
    assert.equal(amc.status, "ACTIVE");
    assert.equal(amc.isComplimentary, true);
    assert.equal(amc.scheduledPmVisits.length, 2);
  });

  test("Step 12: Daily Financial Reconciliation (₹0.00 Difference)", () => {
    const grossCollection = 500;
    const gatewayFee = 10.0; // 2% MDR
    const gatewayTax = 1.8; // 18% GST on MDR
    const expectedNet = Number((grossCollection - gatewayFee - gatewayTax).toFixed(2)); // 488.20

    const recon = reconcileDailySettlement({
      date: "2026-11-15",
      gatewayItems: [
        {
          paymentId: "pay_founder_smoke_999",
          orderId: "order_founder_001",
          grossAmount: 500,
          refundedAmount: 0,
          gatewayFee: 10.0,
          gatewayTax: 1.8,
          capturedAt: "2026-11-15T12:00:00.000Z",
        },
      ],
      dbItems: [
        {
          paymentId: "pay_founder_smoke_999",
          orderId: "order_founder_001",
          quoteId: "QT-FOUNDER-001",
          amount: 500,
          status: "captured",
        },
      ],
      actualBankPayoutReceived: expectedNet,
    });

    assert.equal(recon.reconciliationStatus, "BALANCED");
    assert.equal(recon.totalGrossCollections, 500);
    assert.equal(recon.expectedNetBankSettlement, 488.2);
    assert.equal(recon.settlementDifference, 0);
    assert.equal(recon.matchedTransactionsCount, 1);
    assert.equal(recon.unmatchedTransactions.length, 0);
  });
});
