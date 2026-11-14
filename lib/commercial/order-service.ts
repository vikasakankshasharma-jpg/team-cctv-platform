/**
 * @file lib/commercial/order-service.ts
 * @description Phase 7.2 Commercial Order Service & Concurrency-Safe Minting.
 * Implements server-derived expected amounts, order idempotency, and snapshot binding.
 */

import {
  type PaymentStage,
  type CommercialOrder,
  type CommercialPaymentRecord,
  deriveServerExpectedAmount,
} from "./commercial-contract";
import {
  validatePaymentSequence,
  assertCumulativeCeiling,
  CommercialStateError,
} from "./state-machine";

export interface StoredQuoteLike {
  id: string;
  lead_id?: string;
  leadId?: string;
  status?: string;
  total_payable?: number;
  pricingSnapshot?: {
    total_payable?: number;
    items?: any[];
  };
  orders?: CommercialOrder[];
  payment_history?: CommercialPaymentRecord[];
}

/**
 * Creates or reuses a Commercial Order for a quote snapshot.
 * Guarantees:
 * 1. Strictly bound to stored snapshot total_payable (never recalculates from live catalog)
 * 2. Idempotent: reuses active unexpired order for the same stage
 * 3. Validates payment sequence and cumulative ceiling
 */
export function createCommercialOrder(
  quote: StoredQuoteLike,
  stage: PaymentStage,
  existingOrders: CommercialOrder[] = []
): { order: CommercialOrder; isReused: boolean } {
  // Guard 1: Status assertion
  if (quote.status === "PAID" || quote.status === "DISCARDED" || quote.status === "SUPERSEDED") {
    throw new CommercialStateError(
      `Cannot create commercial order for quote with status "${quote.status}"`,
      "QUOTE_STATUS_INVALID"
    );
  }

  // Guard 2: Authoritative gross total strictly from frozen snapshot
  const grossTotal = Number(
    quote.pricingSnapshot?.total_payable ??
    quote.total_payable ??
    0
  );

  if (grossTotal <= 0) {
    throw new CommercialStateError(
      "Quote has invalid or zero total_payable in snapshot",
      "INVALID_SNAPSHOT_AMOUNT"
    );
  }

  const paymentHistory = quote.payment_history || [];

  // Guard 3: Payment sequence validation
  validatePaymentSequence(stage, paymentHistory);

  // Guard 4: Server-derived expected amount
  const { expectedRupees, expectedPaise } = deriveServerExpectedAmount(
    stage,
    grossTotal,
    paymentHistory
  );

  if (expectedRupees <= 0) {
    throw new CommercialStateError(
      `Derived payable amount for stage "${stage}" is ₹0`,
      "ZERO_PAYABLE_AMOUNT"
    );
  }

  // Guard 5: Cumulative payment ceiling check
  assertCumulativeCeiling(expectedRupees, grossTotal, paymentHistory, stage);

  // Guard 6: Order Creation Idempotency & Concurrency Safety
  // If an active order for this quote and stage exists with identical amount, reuse it.
  const activeExistingOrder = existingOrders.find(
    (o) =>
      o.quote_id === quote.id &&
      o.stage === stage &&
      o.status === "created" &&
      o.amount_paise === expectedPaise
  );

  if (activeExistingOrder) {
    return { order: activeExistingOrder, isReused: true };
  }

  const newOrder: CommercialOrder = {
    id: `order_${quote.id.slice(0, 8)}_${stage}_${Date.now()}`,
    quote_id: quote.id,
    lead_id: quote.lead_id || quote.leadId,
    stage,
    amount_rupees: expectedRupees,
    amount_paise: expectedPaise,
    currency: "INR",
    status: "created",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
  };

  return { order: newOrder, isReused: false };
}
