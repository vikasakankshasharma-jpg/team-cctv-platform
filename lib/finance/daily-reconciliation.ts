/**
 * @file lib/finance/daily-reconciliation.ts
 * @description Phase 8 Daily Financial & Net Settlement Reconciliation Service.
 * Implements authoritative mathematical reconciliation between Razorpay gateway collections,
 * database payment history, refunds, MDR transaction fees, and bank net payout.
 *
 * FORMULA:
 * Expected Net Settlement = Gross Gateway Collections - Refunds - Gateway Fees - Gateway Tax
 */

export interface GatewayTransactionItem {
  paymentId: string;
  orderId: string;
  grossAmount: number;
  refundedAmount: number;
  gatewayFee: number;
  gatewayTax: number;
  capturedAt: string;
  settledAt?: string;
}

export interface InternalPaymentItem {
  paymentId: string;
  orderId: string;
  quoteId: string;
  amount: number;
  status: "captured" | "refunded" | "failed";
}

export interface DailyReconciliationResult {
  date: string;
  totalGrossCollections: number;
  totalRefunds: number;
  totalGatewayFees: number;
  totalGatewayTax: number;
  expectedNetBankSettlement: number;
  actualBankPayoutReceived?: number;
  settlementDifference: number; // actual - expected
  reconciliationStatus: "BALANCED" | "PENDING_BANK_SETTLEMENT" | "MISMATCH_ALERT";
  matchedTransactionsCount: number;
  unmatchedTransactions: string[];
}

/**
 * Reconciles gateway records against internal database payment entries.
 */
export function reconcileDailySettlement(params: {
  date: string;
  gatewayItems: GatewayTransactionItem[];
  dbItems: InternalPaymentItem[];
  actualBankPayoutReceived?: number;
}): DailyReconciliationResult {
  let totalGross = 0;
  let totalRefunds = 0;
  let totalFees = 0;
  let totalTax = 0;

  const dbItemMap = new Map<string, InternalPaymentItem>(params.dbItems.map((item) => [item.paymentId, item]));
  const unmatched: string[] = [];
  let matchedCount = 0;

  for (const gw of params.gatewayItems) {
    totalGross += gw.grossAmount;
    totalRefunds += gw.refundedAmount;
    totalFees += gw.gatewayFee;
    totalTax += gw.gatewayTax;

    const dbRecord = dbItemMap.get(gw.paymentId);
    if (!dbRecord) {
      unmatched.push(`Gateway payment ${gw.paymentId} missing in internal DB`);
    } else if (Math.abs(dbRecord.amount - gw.grossAmount) > 0.01) {
      unmatched.push(`Amount mismatch for ${gw.paymentId}: Gateway=₹${gw.grossAmount}, DB=₹${dbRecord.amount}`);
    } else {
      matchedCount++;
    }
  }

  // Check DB items that might be missing in Gateway
  const gwPaymentIds = new Set(params.gatewayItems.map((g) => g.paymentId));
  for (const db of params.dbItems) {
    if (db.status === "captured" && !gwPaymentIds.has(db.paymentId)) {
      unmatched.push(`DB captured payment ${db.paymentId} missing in Gateway records`);
    }
  }

  const expectedNet = Number((totalGross - totalRefunds - totalFees - totalTax).toFixed(2));
  const actualBank = params.actualBankPayoutReceived;
  const settlementDiff = actualBank !== undefined ? Number((actualBank - expectedNet).toFixed(2)) : 0;

  let status: DailyReconciliationResult["reconciliationStatus"] = "BALANCED";
  if (unmatched.length > 0 || (actualBank !== undefined && Math.abs(settlementDiff) > 1.0)) {
    status = "MISMATCH_ALERT";
  } else if (actualBank === undefined) {
    status = "PENDING_BANK_SETTLEMENT";
  }

  return {
    date: params.date,
    totalGrossCollections: totalGross,
    totalRefunds,
    totalGatewayFees: totalFees,
    totalGatewayTax: totalTax,
    expectedNetBankSettlement: expectedNet,
    actualBankPayoutReceived: actualBank,
    settlementDifference: settlementDiff,
    reconciliationStatus: status,
    matchedTransactionsCount: matchedCount,
    unmatchedTransactions: unmatched,
  };
}
