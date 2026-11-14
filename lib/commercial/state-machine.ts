/**
 * @file lib/commercial/state-machine.ts
 * @description Phase 7.2 Discrete Commercial State Machine & Guards.
 * Implements monotonic transitions, payment sequence guards, and cumulative ceilings.
 */

import {
  type CommercialState,
  type PaymentStage,
  type CommercialPaymentRecord,
  calculateCommercialMilestones,
} from "./commercial-contract";

export class CommercialStateError extends Error {
  public readonly code: string;
  constructor(message: string, code: string = "INVALID_STATE_TRANSITION") {
    super(message);
    this.name = "CommercialStateError";
    this.code = code;
  }
}

/**
 * Valid monotonic transitions map.
 * Backward transitions or state downgrades are strictly forbidden.
 */
const VALID_TRANSITIONS: Record<CommercialState, readonly CommercialState[]> = {
  QUOTE_ISSUED: ["ORDER_CREATED"],
  ORDER_CREATED: ["PAYMENT_PENDING", "ORDER_CREATED"], // Can regenerate/reuse order if expired/unpaid
  PAYMENT_PENDING: ["PAYMENT_CAPTURED", "PAYMENT_FAILURE"],
  PAYMENT_FAILURE: ["PAYMENT_PENDING"], // Retry allows re-entering pending
  PAYMENT_CAPTURED: ["INVOICE_ISSUED", "REFUNDED"],
  INVOICE_ISSUED: ["INVENTORY_RESERVED", "BACKORDERED", "REFUNDED"],
  INVENTORY_RESERVED: ["JOB_DISPATCHED", "REFUNDED"],
  BACKORDERED: ["INVENTORY_RESERVED", "REFUNDED"], // Can fulfill once restocked
  JOB_DISPATCHED: ["REFUNDED"],
  REFUNDED: [], // Terminal
};

/**
 * Validates that transition from currentState to targetState is monotonically valid.
 */
export function validateStateTransition(
  currentState: CommercialState,
  targetState: CommercialState
): void {
  // Idempotency: Transitioning to the exact same state is a no-op / valid idempotent event
  if (currentState === targetState) {
    return;
  }

  const allowed = VALID_TRANSITIONS[currentState] || [];
  if (!allowed.includes(targetState)) {
    throw new CommercialStateError(
      `Monotonic violation: cannot transition from ${currentState} to ${targetState}`,
      "INVALID_MONOTONIC_TRANSITION"
    );
  }
}

/**
 * Gate 7.2.9: Payment Sequence & Transition Guard.
 * Validates that the requested stage is permissible given previously captured payments.
 * Rejects illegal jumps (e.g., attempting `installation_final` without `delivery_90`).
 */
export function validatePaymentSequence(
  requestedStage: PaymentStage,
  paymentHistory: readonly CommercialPaymentRecord[] = []
): void {
  const capturedStages = new Set(
    paymentHistory.filter((p) => p.status === "captured").map((p) => p.stage)
  );

  const hasBooking = capturedStages.has("booking");
  const hasDelivery = capturedStages.has("delivery_90");
  const hasFull = capturedStages.has("full") || capturedStages.has("full_discount");

  if (hasFull) {
    throw new CommercialStateError(
      "Quote is already fully settled. No additional payment stages permitted.",
      "ALREADY_FULLY_PAID"
    );
  }

  switch (requestedStage) {
    case "booking": {
      if (hasBooking) {
        throw new CommercialStateError(
          "Booking advance has already been paid for this quote.",
          "BOOKING_ALREADY_PAID"
        );
      }
      break;
    }

    case "delivery_90": {
      if (!hasBooking) {
        throw new CommercialStateError(
          "Invalid payment sequence: Booking token must be captured before 90% delivery payment.",
          "SEQUENCE_VIOLATION_MISSING_BOOKING"
        );
      }
      if (hasDelivery) {
        throw new CommercialStateError(
          "Delivery milestone (90%) has already been paid.",
          "DELIVERY_ALREADY_PAID"
        );
      }
      break;
    }

    case "installation_final": {
      if (!hasBooking || !hasDelivery) {
        throw new CommercialStateError(
          "Invalid payment sequence: Both booking and delivery milestones must be captured before final installation payment.",
          "SEQUENCE_VIOLATION_MISSING_DELIVERY"
        );
      }
      break;
    }

    case "full":
    case "full_discount": {
      // Full payment is allowed as initial payment or as immediate settlement after booking
      break;
    }

    default:
      throw new CommercialStateError(`Unknown payment stage: ${requestedStage}`, "UNKNOWN_STAGE");
  }
}

/**
 * Gate 7.2.10: Cumulative Payment Ceiling.
 * Asserts that alreadyPaid + incomingAmount does not exceed the commercial total.
 */
export function assertCumulativeCeiling(
  incomingAmountRupees: number,
  grossTotal: number,
  paymentHistory: readonly CommercialPaymentRecord[] = [],
  stage: PaymentStage
): void {
  const milestones = calculateCommercialMilestones(grossTotal);
  const commercialCeiling =
    stage === "full_discount" ? milestones.fullDiscountGross : milestones.grossTotal;

  const alreadyPaid = paymentHistory
    .filter((p) => p.status === "captured")
    .reduce((sum, p) => sum + p.amount, 0);

  const projectedTotal = alreadyPaid + incomingAmountRupees;

  // Allow ₹1 margin for integer rounding differences
  if (projectedTotal > commercialCeiling + 1) {
    throw new CommercialStateError(
      `Cumulative payment ceiling exceeded! Projected total ₹${projectedTotal} exceeds commercial ceiling ₹${commercialCeiling}`,
      "PAYMENT_CEILING_EXCEEDED"
    );
  }
}
