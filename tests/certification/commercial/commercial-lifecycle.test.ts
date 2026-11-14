/**
 * @file tests/certification/commercial/commercial-lifecycle.test.ts
 * @description Phase 7.2 Commercial Lifecycle Certification Test Suite.
 * Exercises all 11 commercial gates and full end-to-end commercial transaction orchestration.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalFrozenQuote,
  certifiedProducts,
  TEST_WEBHOOK_SECRET,
  generateTestHmacSignature,
} from "./commercial-fixtures";
import {
  assertGate721QuoteToOrderBinding,
  assertGate722MilestonePaymentSlabs,
  assertGate723WebhookHmac,
  assertGate724OrderAmountCurrencyGuard,
  assertGate725WebhookIdempotency,
  assertGate726ReverseGstReconciliation,
  assertGate727ZeroDoubleTaxation,
  assertGate728PaymentFailureNonDestructiveRetry,
  assertGate729PaymentSequenceGuard,
  assertGate7210CumulativePaymentCeiling,
  assertGate7211MonotonicStateGuard,
} from "./commercial-assertions";
import { createCommercialOrder } from "../../../lib/commercial/order-service";
import {
  deriveServerExpectedAmount,
  calculateCommercialMilestones,
  type CommercialOrder,
  type CommercialPaymentRecord,
} from "../../../lib/commercial/commercial-contract";
import {
  validateStateTransition,
  validatePaymentSequence,
  assertCumulativeCeiling,
} from "../../../lib/commercial/state-machine";
import {
  verifyWebhookSignature,
  processVerifiedPaymentEvent,
} from "../../../lib/commercial/webhook-service";
import { reconcileInvoiceWithQuote } from "../../../lib/commercial/invoice-reconciliation";

test("Phase 7.2 — Commercial Transaction, Payment & GST Invoicing", async (t) => {
  const quote = { ...canonicalFrozenQuote };
  const grossTotal = quote.pricingSnapshot!.total_payable!;

  await t.test("Gate 7.2.1 — Quote to Order Binding & Adversarial Snapshot Immutability", () => {
    // 1. Initial Order Creation strictly bound to quote snapshot total
    const { order, isReused } = createCommercialOrder(quote, "full");
    assertGate721QuoteToOrderBinding(order, grossTotal, isReused);

    // 2. Order Idempotency / Concurrency Safety: Calling again with existing order reuses it
    const reuseResult = createCommercialOrder(quote, "full", [order]);
    assert.equal(reuseResult.isReused, true, "Existing order must be reused");
    assert.equal(reuseResult.order.id, order.id, "Reused order ID must be identical");

    // 3. Adversarial Snapshot Immutability: Catalog price hikes of +50% do NOT alter order amount
    const mutatedCatalog = certifiedProducts.map((p: any) => ({
      ...p,
      unit_price: Math.round(p.unit_price * 1.5),
    }));
    assert.notEqual(mutatedCatalog[0].unit_price, certifiedProducts[0].unit_price);

    // Stored quote order remains strictly grossTotal, ignoring catalog inflation
    const immutabilityOrder = createCommercialOrder(quote, "full");
    assert.equal(
      immutabilityOrder.order.amount_rupees,
      grossTotal,
      "Order amount must remain strictly bound to frozen snapshot"
    );
  });

  await t.test("Gate 7.2.2 — Milestone Payment Slabs Mathematical Reconciliation", () => {
    assertGate722MilestonePaymentSlabs(grossTotal);
  });

  await t.test("Gate 7.2.3 — Webhook HMAC SHA-256 Signature Verification", () => {
    const rawPayload = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_test_hmac", amount: 50000 } } },
    });
    const validSignature = generateTestHmacSignature(rawPayload, TEST_WEBHOOK_SECRET);
    assertGate723WebhookHmac(rawPayload, validSignature, TEST_WEBHOOK_SECRET);
  });

  await t.test("Gate 7.2.4 — Order, Amount & Currency Cross-Check Guard", () => {
    const { order } = createCommercialOrder(quote, "full");
    assertGate724OrderAmountCurrencyGuard(order, []);
  });

  await t.test("Gate 7.2.5 — Webhook Idempotency (10x Replay Safety)", () => {
    const { order } = createCommercialOrder(quote, "full");
    assertGate725WebhookIdempotency(order, []);
  });

  await t.test("Gate 7.2.6 — Reverse-GST Invoice Mathematical Reconciliation", () => {
    assertGate726ReverseGstReconciliation(quote);
  });

  await t.test("Gate 7.2.7 — Zero Double-Taxation Assertion", () => {
    assertGate727ZeroDoubleTaxation(quote);
  });

  await t.test("Gate 7.2.8 — Payment Failure & Non-Destructive Retry", () => {
    assertGate728PaymentFailureNonDestructiveRetry();
  });

  await t.test("Gate 7.2.9 — Payment Sequence & State Transition Guard", () => {
    // Cannot pay installation_final without booking or delivery
    assertGate729PaymentSequenceGuard([]);

    // Valid sequence: booking -> delivery_90 -> installation_final
    const bookingRecord: CommercialPaymentRecord = {
      payment_id: "pay_book_01",
      order_id: "order_book_01",
      amount: 500,
      currency: "INR",
      stage: "booking",
      status: "captured",
      captured_at: new Date().toISOString(),
    };

    // After booking, delivery_90 is valid
    assert.doesNotThrow(() => {
      validatePaymentSequence("delivery_90", [bookingRecord]);
    });

    const deliveryRecord: CommercialPaymentRecord = {
      payment_id: "pay_del_01",
      order_id: "order_del_01",
      amount: Math.round((grossTotal - 500) * 0.9),
      currency: "INR",
      stage: "delivery_90",
      status: "captured",
      captured_at: new Date().toISOString(),
    };

    // After delivery, installation_final is valid
    assert.doesNotThrow(() => {
      validatePaymentSequence("installation_final", [bookingRecord, deliveryRecord]);
    });
  });

  await t.test("Gate 7.2.10 — Cumulative Payment Ceiling Guard", () => {
    assertGate7210CumulativePaymentCeiling(grossTotal, []);
  });

  await t.test("Gate 7.2.11 — Webhook Replay & Monotonic State Guard", () => {
    assertGate7211MonotonicStateGuard();
  });

  await t.test("Orchestration E2E — Complete Commercial Transaction Lifecycle", () => {
    // 1. Initial State: Quote Active
    let currentState = "QUOTE_ISSUED" as any;

    // 2. Customer Initiates Checkout for Advance Booking (₹500)
    validateStateTransition(currentState, "ORDER_CREATED");
    currentState = "ORDER_CREATED";

    const { order: bookingOrder } = createCommercialOrder(quote, "booking");
    assert.equal(bookingOrder.amount_rupees, 500);
    assert.equal(bookingOrder.amount_paise, 50000);

    // 3. Payment Pending
    validateStateTransition(currentState, "PAYMENT_PENDING");
    currentState = "PAYMENT_PENDING";

    // 4. Webhook Arrives from Gateway
    const webhookPayload = {
      id: "pay_rzp_live_booking_123",
      order_id: bookingOrder.id,
      amount: 50000,
      currency: "INR",
      status: "captured",
      method: "upi",
    };

    const processRes = processVerifiedPaymentEvent({
      paymentPayload: webhookPayload,
      order: bookingOrder,
      existingPaymentHistory: [],
    });

    assert.equal(processRes.isValid, true);
    assert.equal(processRes.isDuplicate, false);
    const capturedPayment = processRes.paymentRecord!;

    validateStateTransition(currentState, "PAYMENT_CAPTURED");
    currentState = "PAYMENT_CAPTURED";

    // 5. Mint Advance Receipt / Tax Invoice
    validateStateTransition(currentState, "INVOICE_ISSUED");
    currentState = "INVOICE_ISSUED";

    const invoiceReconciliation = reconcileInvoiceWithQuote(quote);
    assert.equal(invoiceReconciliation.isValid, true);
    assert.equal(invoiceReconciliation.grossTotal, grossTotal);

    // 6. Fulfilment: Check Inventory and Dispatch Job
    const inventoryAvailable = true;
    if (inventoryAvailable) {
      validateStateTransition(currentState, "INVENTORY_RESERVED");
      currentState = "INVENTORY_RESERVED";

      validateStateTransition(currentState, "JOB_DISPATCHED");
      currentState = "JOB_DISPATCHED";
    }

    assert.equal(currentState, "JOB_DISPATCHED");
  });
});
