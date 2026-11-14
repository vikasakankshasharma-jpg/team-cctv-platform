/**
 * @file lib/commercial/webhook-service.ts
 * @description Phase 7.2 Webhook Security, Verification & Idempotency Service.
 * Enforces HMAC SHA-256 verification, payment ID uniqueness, exact amount cross-checks,
 * and monotonic replay safety.
 */

import crypto from "node:crypto";
import {
  type CommercialOrder,
  type CommercialPaymentRecord,
} from "./commercial-contract";
import { CommercialStateError } from "./state-machine";

export interface WebhookVerificationResult {
  isValid: boolean;
  isDuplicate: boolean;
  paymentRecord?: CommercialPaymentRecord;
  error?: string;
}

/**
 * Gate 7.2.3: Verifies Razorpay Webhook HMAC SHA-256 Signature.
 * Strict fail-closed comparison.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string
): boolean {
  if (!signature || !secret || !rawBody) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  try {
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expectedSignature, "utf8");
    if (sigBuf.length !== expBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Gate 7.2.4 & 7.2.5: Validates and cross-checks payment payload against bound order.
 * Enforces:
 * 1. Payment ID Uniqueness
 * 2. Order ID Match
 * 3. Currency Match (INR)
 * 4. Amount tolerance (<= 100 paise)
 * 5. Webhook Replay Idempotency
 */
export function processVerifiedPaymentEvent(params: {
  paymentPayload: {
    id: string;
    order_id: string;
    amount: number; // in paise
    currency: string;
    method?: string;
    status: string;
    fee?: number;
    tax?: number;
  };
  order: CommercialOrder;
  existingPaymentHistory: readonly CommercialPaymentRecord[];
}): WebhookVerificationResult {
  const { paymentPayload, order, existingPaymentHistory } = params;

  // Check 1: Payment ID Uniqueness / Idempotency Check
  const alreadyProcessed = existingPaymentHistory.some(
    (p) => p.payment_id === paymentPayload.id
  );
  if (alreadyProcessed) {
    return {
      isValid: true,
      isDuplicate: true,
    };
  }

  // Check 2: Order ID Match
  if (paymentPayload.order_id !== order.id) {
    throw new CommercialStateError(
      `Order ID mismatch: expected ${order.id}, got ${paymentPayload.order_id}`,
      "ORDER_ID_MISMATCH"
    );
  }

  // Check 3: Currency Match
  if (paymentPayload.currency !== "INR") {
    throw new CommercialStateError(
      `Currency mismatch: expected INR, got ${paymentPayload.currency}`,
      "CURRENCY_MISMATCH"
    );
  }

  // Check 4: Amount Match within 100 paise (₹1) tolerance
  const diffPaise = Math.abs(paymentPayload.amount - order.amount_paise);
  if (diffPaise > 100) {
    throw new CommercialStateError(
      `Payment amount mismatch: expected ${order.amount_paise} paise, received ${paymentPayload.amount} paise (difference ${diffPaise} paise exceeds 100 paise)`,
      "AMOUNT_MISMATCH"
    );
  }

  // Build canonical payment record
  const paymentRecord: CommercialPaymentRecord = {
    payment_id: paymentPayload.id,
    order_id: order.id,
    amount: paymentPayload.amount / 100, // converted to Rupees
    currency: "INR",
    stage: order.stage,
    method: paymentPayload.method || "unknown",
    status: paymentPayload.status === "captured" ? "captured" : "failed",
    captured_at: new Date().toISOString(),
    razorpay_fee: paymentPayload.fee ? paymentPayload.fee / 100 : null,
    razorpay_tax: paymentPayload.tax ? paymentPayload.tax / 100 : null,
  };

  return {
    isValid: true,
    isDuplicate: false,
    paymentRecord,
  };
}
