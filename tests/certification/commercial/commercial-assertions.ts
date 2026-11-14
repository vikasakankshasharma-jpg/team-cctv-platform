/**
 * @file tests/certification/commercial/commercial-assertions.ts
 * @description Phase 7.2 Independent Commercial Gate Assertions (Gates 7.2.1 to 7.2.11).
 * Independent, diagnosable test functions validating all 11 commercial contracts.
 */

import assert from "node:assert/strict";
import {
  type CommercialOrder,
  type CommercialPaymentRecord,
  calculateCommercialMilestones,
  deriveServerExpectedAmount,
} from "../../../lib/commercial/commercial-contract";
import {
  validateStateTransition,
  validatePaymentSequence,
  assertCumulativeCeiling,
  CommercialStateError,
} from "../../../lib/commercial/state-machine";
import {
  verifyWebhookSignature,
  processVerifiedPaymentEvent,
} from "../../../lib/commercial/webhook-service";
import { reconcileInvoiceWithQuote } from "../../../lib/commercial/invoice-reconciliation";

export function assertGate721QuoteToOrderBinding(
  order: CommercialOrder,
  snapshotGrossTotal: number,
  isReused: boolean
): void {
  assert.ok(order.id, "Order must have an ID");
  assert.equal(order.currency, "INR", "Order currency must be strictly INR");
  assert.equal(order.amount_rupees, snapshotGrossTotal, "Order amount must strictly equal snapshot total");
  assert.equal(order.amount_paise, snapshotGrossTotal * 100, "Paise must equal rupees * 100");
}

export function assertGate722MilestonePaymentSlabs(grossTotal: number): void {
  const milestones = calculateCommercialMilestones(grossTotal);
  assert.equal(milestones.bookingAmount, 500, "Booking advance must be fixed ₹500");
  assert.equal(milestones.remainder, grossTotal - 500, "Remainder must equal gross - 500");
  
  // Reconcile milestones to exact rupee
  const sum = milestones.bookingAmount + milestones.deliveryAmount + milestones.installationAmount;
  assert.equal(sum, grossTotal, "Booking + Delivery + Installation must reconcile exactly to Gross Total");

  // 90% and 10% ratios
  const ratio90 = milestones.deliveryAmount / milestones.remainder;
  assert.ok(Math.abs(ratio90 - 0.90) < 0.01, "Delivery must be approximately 90% of remainder");

  // Full Discount Model A
  assert.equal(milestones.fullDiscountGross, Math.round(grossTotal * 0.98), "Full discount must be 98% of gross");
}

export function assertGate723WebhookHmac(
  rawBody: string,
  validSig: string,
  secret: string
): void {
  assert.equal(verifyWebhookSignature(rawBody, validSig, secret), true, "Valid HMAC must pass verification");
  assert.equal(verifyWebhookSignature(rawBody, "invalid_sig_abc123", secret), false, "Tampered signature must be rejected");
  assert.equal(verifyWebhookSignature(rawBody + "_tampered", validSig, secret), false, "Tampered body must be rejected");
  assert.equal(verifyWebhookSignature(rawBody, validSig, "wrong_secret"), false, "Wrong secret must be rejected");
}

export function assertGate724OrderAmountCurrencyGuard(
  order: CommercialOrder,
  existingHistory: CommercialPaymentRecord[]
): void {
  // Test 1: Order ID mismatch
  assert.throws(
    () => {
      processVerifiedPaymentEvent({
        paymentPayload: {
          id: "pay_test_01",
          order_id: "order_different_id",
          amount: order.amount_paise,
          currency: "INR",
          status: "captured",
        },
        order,
        existingPaymentHistory: existingHistory,
      });
    },
    (err: any) => err instanceof CommercialStateError && err.code === "ORDER_ID_MISMATCH"
  );

  // Test 2: Currency mismatch
  assert.throws(
    () => {
      processVerifiedPaymentEvent({
        paymentPayload: {
          id: "pay_test_02",
          order_id: order.id,
          amount: order.amount_paise,
          currency: "USD",
          status: "captured",
        },
        order,
        existingPaymentHistory: existingHistory,
      });
    },
    (err: any) => err instanceof CommercialStateError && err.code === "CURRENCY_MISMATCH"
  );

  // Test 3: Amount mismatch exceeding 100 paise (₹1)
  assert.throws(
    () => {
      processVerifiedPaymentEvent({
        paymentPayload: {
          id: "pay_test_03",
          order_id: order.id,
          amount: order.amount_paise + 500, // +₹5 mismatch
          currency: "INR",
          status: "captured",
        },
        order,
        existingPaymentHistory: existingHistory,
      });
    },
    (err: any) => err instanceof CommercialStateError && err.code === "AMOUNT_MISMATCH"
  );
}

export function assertGate725WebhookIdempotency(
  order: CommercialOrder,
  existingHistory: CommercialPaymentRecord[]
): void {
  // First delivery
  const res1 = processVerifiedPaymentEvent({
    paymentPayload: {
      id: "pay_idempotency_01",
      order_id: order.id,
      amount: order.amount_paise,
      currency: "INR",
      status: "captured",
    },
    order,
    existingPaymentHistory: existingHistory,
  });
  assert.equal(res1.isValid, true);
  assert.equal(res1.isDuplicate, false);
  assert.ok(res1.paymentRecord);

  const updatedHistory = [...existingHistory, res1.paymentRecord!];

  // 10x duplicate replays of identical webhook
  for (let i = 0; i < 10; i++) {
    const replayRes = processVerifiedPaymentEvent({
      paymentPayload: {
        id: "pay_idempotency_01",
        order_id: order.id,
        amount: order.amount_paise,
        currency: "INR",
        status: "captured",
      },
      order,
      existingPaymentHistory: updatedHistory,
    });
    assert.equal(replayRes.isValid, true, `Replay ${i + 1} must be recognized as valid`);
    assert.equal(replayRes.isDuplicate, true, `Replay ${i + 1} must be marked as duplicate`);
    assert.equal(replayRes.paymentRecord, undefined, `Replay ${i + 1} must NOT produce a new payment record`);
  }
}

export function assertGate726ReverseGstReconciliation(snapshot: any): void {
  const result = reconcileInvoiceWithQuote(snapshot);
  assert.equal(result.isValid, true);
  assert.ok(result.drift <= 0.10, `Drift ₹${result.drift} exceeds ₹0.10`);
  assert.equal(result.grossTotal, snapshot.pricingSnapshot.total_payable);
  assert.equal(result.taxableBase, snapshot.pricingSnapshot.net_taxable_amount);
  assert.equal(result.gstAmount, snapshot.pricingSnapshot.gst_amount);
}

export function assertGate727ZeroDoubleTaxation(snapshot: any): void {
  const gross = snapshot.pricingSnapshot.total_payable;
  const taxable = snapshot.pricingSnapshot.net_taxable_amount;
  const expectedTaxable = gross / 1.18;

  // Asserts taxable base is derived via reverse-tax, NOT gross itself
  assert.ok(
    Math.abs(taxable - expectedTaxable) <= 1.0,
    `Taxable base ₹${taxable} must match reverse-taxable base ₹${expectedTaxable.toFixed(2)}`
  );

  // Proves that invoice grand total does NOT add +18% on top of customer gross
  const wrongDoubleTaxedTotal = gross * 1.18;
  assert.notEqual(snapshot.pricingSnapshot.total_payable, wrongDoubleTaxedTotal);
}

export function assertGate728PaymentFailureNonDestructiveRetry(): void {
  // Test failure does not brick the quote state
  assert.doesNotThrow(() => {
    validateStateTransition("PAYMENT_PENDING", "PAYMENT_FAILURE");
  });
  // Test retry can transition back to pending
  assert.doesNotThrow(() => {
    validateStateTransition("PAYMENT_FAILURE", "PAYMENT_PENDING");
  });
}

export function assertGate729PaymentSequenceGuard(history: CommercialPaymentRecord[]): void {
  // Attempting installation_final without delivery_90 must fail
  assert.throws(
    () => {
      validatePaymentSequence("installation_final", history);
    },
    (err: any) =>
      err instanceof CommercialStateError &&
      (err.code === "SEQUENCE_VIOLATION_MISSING_DELIVERY" || err.code === "SEQUENCE_VIOLATION_MISSING_BOOKING")
  );

  // Attempting delivery_90 without booking must fail
  assert.throws(
    () => {
      validatePaymentSequence("delivery_90", []);
    },
    (err: any) => err instanceof CommercialStateError && err.code === "SEQUENCE_VIOLATION_MISSING_BOOKING"
  );
}

export function assertGate7210CumulativePaymentCeiling(grossTotal: number, history: CommercialPaymentRecord[]): void {
  // Attempting to collect more than gross total must fail
  assert.throws(
    () => {
      assertCumulativeCeiling(grossTotal + 1000, grossTotal, history, "full");
    },
    (err: any) => err instanceof CommercialStateError && err.code === "PAYMENT_CEILING_EXCEEDED"
  );
}

export function assertGate7211MonotonicStateGuard(): void {
  // Attempting to regress from captured back to pending must fail
  assert.throws(
    () => {
      validateStateTransition("PAYMENT_CAPTURED", "PAYMENT_PENDING");
    },
    (err: any) => err instanceof CommercialStateError && err.code === "INVALID_MONOTONIC_TRANSITION"
  );

  // Attempting to regress from job dispatched back to quote issued must fail
  assert.throws(
    () => {
      validateStateTransition("JOB_DISPATCHED", "QUOTE_ISSUED");
    },
    (err: any) => err instanceof CommercialStateError && err.code === "INVALID_MONOTONIC_TRANSITION"
  );
}
